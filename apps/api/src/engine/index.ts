import { redis } from "@repo/shared-redis";
import { IClosedOrderRes, IOpenOrderRes } from "../routes/trade.js";
import { Heap } from "heap-js";
import * as crypto from "crypto";

// SCALE: price / USD amounts are stored as integers scaled by SCALE.
// Quantity (QTY) is treated as a float (not scaled). When combining price * qty,
// you get a scaled integer amount (priceScaled * qty => scaledAmount).
const SCALE = 100; // cents
export const p = (x: number | string) => Math.round(Number(x) * SCALE);
export const u = (x: number | string) => Number(x) / SCALE;

interface HeapNode {
  orderId: string;
  price: number; // scaled by SCALE
}

export type Balance = {
  usd: number; // scaled (cents)
  locked_usd: number; // scaled
  [asset: string]: any;
};

export interface OPEN_ORDERS extends IOpenOrderRes {
  userId: string;
}

export interface CLOSED_ORDERS extends IClosedOrderRes {
  userId: string;
}

/**
 * Engine: manages order placement, open orders, and liquidation triggers.
 * - Spot buys/sells (leverage = 1)
 * - Leveraged longs/shorts (leverage > 1)
 *
 * Assumptions & conventions:
 * - Prices stored as scaled integers (p())
 * - QTY is decimal (e.g., 0.12 ETH)
 * - Margins and balances are scaled integers
 * - When locking balance we always use scaled amount
 */
export class Engine {
  private static PENDING_ORDERS = new Map<string, OPEN_ORDERS>();

  public static OPEN_ORDERS = new Map<string, OPEN_ORDERS>();
  public static CLOSED_ORDERS = new Map<string, CLOSED_ORDERS>();

  public static userOrderMap = new Map<string, Set<string>>();

  // per-market heaps (price values are scaled)
  public static stopLossLongMap = new Map<string, Heap<HeapNode>>();
  public static stopLossShortMap = new Map<string, Heap<HeapNode>>();

  public static takeProfitLongMap = new Map<string, Heap<HeapNode>>();
  public static takeProfitShortMap = new Map<string, Heap<HeapNode>>();

  public static leveragedLongMap = new Map<string, Heap<HeapNode>>();
  public static leveragedShortMap = new Map<string, Heap<HeapNode>>();

  private constructor() {}

  public static async getUserData(userId: string) {
    const raw = await redis.hGetAll(userId);
    if (!raw || !raw.balance) throw new Error("User data not found");

    const balance: Balance = raw.balance
      ? JSON.parse(raw.balance)
      : { usd: 0, locked_usd: 0 };
    return {
      ...raw,
      balance,
      assets: raw.assets ? JSON.parse(raw.assets) : {},
      borrowedAssets: raw.borrowedAssets ? JSON.parse(raw.borrowedAssets) : {},
    };
  }

  public static async updateUserData(
    userId: string,
    updates: {
      balance?: Balance;
      assets?: Record<string, any>;
      borrowedAssets?: Record<string, number>;
    }
  ) {
    const current = await redis.hGetAll(userId);
    const next: Record<string, string> = { ...current };

    if (updates.balance) next.balance = JSON.stringify(updates.balance);
    if (updates.assets) next.assets = JSON.stringify(updates.assets);
    if (updates.borrowedAssets)
      next.borrowedAssets = JSON.stringify(updates.borrowedAssets);

    await redis.hSet(userId, next);
  }

  // lock scaledAmount (integer) from usd -> locked_usd
  public static async LockBalance({
    userId,
    amountToLock,
  }: {
    amountToLock: number; // scaled integer
    userId: string;
  }) {
    const user = await this.getUserData(userId);
    const bal = user.balance as Balance;

    if (bal.usd < amountToLock) {
      throw new Error("Insufficient balance");
    }

    const newBal: Balance = {
      ...bal,
      usd: bal.usd - amountToLock,
      locked_usd: bal.locked_usd + amountToLock,
    };

    await this.updateUserData(userId, { balance: newBal });
  }

  // release locked amount back to usd
  public static async ReleaseLocked({
    userId,
    amount,
  }: {
    userId: string;
    amount: number;
  }) {
    const user = await this.getUserData(userId);
    const bal = user.balance as Balance;
    const release = Math.min(bal.locked_usd, amount);
    const newBal: Balance = {
      ...bal,
      locked_usd: bal.locked_usd - release,
      usd: bal.usd + release,
    };
    await this.updateUserData(userId, { balance: newBal });
  }

  public static async process(data: {
    type: "market" | "limit";
    side: "buy" | "sell";
    QTY: number; // decimal
    TP?: number; // raw price
    SL?: number; // raw price
    market: string; // e.g., SOLUSDT
    balance: string;
    userId: string;
    leverage: number; // 1 means spot/no-leverage
  }) {
    const market = data.market.toLowerCase();
    const tradeData = await redis.get(`trade:${market}`);
    if (!tradeData) {
      throw new Error("Market data not found");
    }

    const { buy, sell } = JSON.parse(tradeData);
    const buyPriceScaled = p(buy);
    const sellPriceScaled = p(sell);

    let user = await this.getUserData(data.userId);
    let bal = user.balance as Balance;

    const leverageUsed = data.leverage ? Number(data.leverage) : 1;
    if (leverageUsed <= 0 || leverageUsed > 40)
      throw new Error("Invalid leverage");

    // Decide how much to lock up-front (in scaled units)
    // For BUY (long): lock margin = notional / leverage
    // For SELL (short): if spot (leverage=1) ensure user asset qty; if leveraged, lock margin similar to buy
    let amountToLockScaled = 0;

    const qty = Number(data.QTY);
    if (qty <= 0) throw new Error("Quantity must be > 0");

    if (data.side === "buy") {
      const notionalScaled = Math.floor(qty * sellPriceScaled); // scaled
      amountToLockScaled =
        leverageUsed > 1
          ? Math.floor(notionalScaled / leverageUsed)
          : notionalScaled;
      // lock margin (this will throw if insufficient)
      await this.LockBalance({
        userId: data.userId,
        amountToLock: amountToLockScaled,
      });
    } else {
      // sell
      if (leverageUsed === 1) {
        // spot sell -> ensure user owns asset
        const assets = user.assets || {};
        const holding = assets[market]?.qty || 0;
        if (holding < qty) {
          throw new Error("Insufficient asset balance for sell");
        }
        amountToLockScaled = 0; // nothing to lock in USD
      } else {
        // leveraged short -> lock margin based on buy price
        const notionalScaled = Math.floor(qty * buyPriceScaled);
        amountToLockScaled = Math.floor(notionalScaled / leverageUsed);
        await this.LockBalance({
          userId: data.userId,
          amountToLock: amountToLockScaled,
        });
      }
    }

    // reload user after lock
    user = await this.getUserData(data.userId);
    bal = user.balance as Balance;

    const orderId = crypto.randomUUID();

    // Helper to register order in maps
    const registerOpenOrder = (order: OPEN_ORDERS) => {
      this.OPEN_ORDERS.set(order.orderId, order);
      if (!this.userOrderMap.has(order.userId))
        this.userOrderMap.set(order.userId, new Set());
      this.userOrderMap.get(order.userId)!.add(order.orderId);
    };

    /** ---------- BUY (LONG) ---------- */
    if (data.side === "buy") {
      // MARKET & NO LEVERAGE => immediate spot buy
      if (data.type === "market" && leverageUsed === 1) {
        const notionalScaled = Math.floor(qty * sellPriceScaled);

        const order: OPEN_ORDERS = {
          orderId,
          type: "market",
          side: "buy",
          QTY: qty,
          TP: data.TP !== undefined ? p(data.TP) : undefined,
          SL: data.SL !== undefined ? p(data.SL) : undefined,
          userId: data.userId,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: sellPriceScaled,
        } as OPEN_ORDERS;

        registerOpenOrder(order);

        // push TP/SL
        if (data.SL !== undefined && data.SL > 0) {
          if (!this.stopLossLongMap.has(market))
            this.stopLossLongMap.set(
              market,
              new Heap<HeapNode>((a, b) => a.price - b.price)
            );
          this.stopLossLongMap
            .get(market)!
            .push({ orderId, price: p(data.SL) });
        }
        if (data.TP !== undefined && data.TP > 0) {
          if (!this.takeProfitLongMap.has(market))
            this.takeProfitLongMap.set(
              market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitLongMap
            .get(market)!
            .push({ orderId, price: p(data.TP) });
        }

        // consume locked USD -> credit assets
        // we locked notionalScaled earlier; now consume it from locked_usd
        const newBal: Balance = {
          ...bal,
          locked_usd: bal.locked_usd - notionalScaled,
        };

        const assets = user.assets || {};
        assets[market] = {
          side: "long",
          qty: (assets[market]?.qty || 0) + qty,
          leverage: 1,
          entryPrice: sellPriceScaled,
        };

        await this.updateUserData(data.userId, { balance: newBal, assets });
        return orderId;
      }

      // MARKET leveraged long
      if (data.type === "market" && leverageUsed > 1) {
        const totalQty = qty;
        const notionalScaled = Math.floor(totalQty * sellPriceScaled);
        const margin = Math.floor(notionalScaled / leverageUsed); // scaled

        if (margin > (bal.locked_usd || 0)) {
          // this should not happen because LockBalance was invoked earlier; just guard
          throw new Error("Insufficient margin after lock");
        }

        const order: OPEN_ORDERS = {
          market: data.market,
          openPrice: sellPriceScaled,
          orderId,
          QTY: totalQty,
          leverage: leverageUsed,
          side: "buy",
          type: "market",
          margin,
          SL: data.SL !== undefined ? p(data.SL) : undefined,
          userId: data.userId,
          TP: data.TP !== undefined ? p(data.TP) : undefined,
          createdAt: new Date().toISOString(),
        } as OPEN_ORDERS;

        registerOpenOrder(order);

        if (data.SL !== undefined && data.SL > 0) {
          if (!this.stopLossLongMap.has(market))
            this.stopLossLongMap.set(
              market,
              new Heap<HeapNode>((a, b) => a.price - b.price)
            );
          this.stopLossLongMap
            .get(market)!
            .push({ orderId, price: p(data.SL) });
        }
        if (data.TP !== undefined && data.TP > 0) {
          if (!this.takeProfitLongMap.has(market))
            this.takeProfitLongMap.set(
              market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitLongMap
            .get(market)!
            .push({ orderId, price: p(data.TP) });
        }

        if (!this.leveragedLongMap.has(market))
          this.leveragedLongMap.set(
            market,
            new Heap<HeapNode>((a, b) => b.price - a.price)
          );
        this.leveragedLongMap
          .get(market)!
          .push({ orderId, price: sellPriceScaled });

        // Update borrowedAssets: we consider treasury/lending handled elsewhere.
        const borrowedAssets = user.borrowedAssets || {};
        borrowedAssets[market] = {
          side: "long",
          qty: totalQty + (borrowedAssets[market]?.qty || 0),
          leverage: leverageUsed,
          entryPrice: sellPriceScaled,
        };

        // consume margin from locked_usd (it was reserved earlier)
        const newBal: Balance = {
          ...bal,
          locked_usd: bal.locked_usd - margin,
        };

        await this.updateUserData(data.userId, {
          borrowedAssets,
          balance: newBal,
        });
        return orderId;
      }

      // LIMIT order handling left as pending (not implemented here)
    }

    /** ---------- SELL (SHORT) ---------- */
    if (data.side === "sell") {
      // Market order handling (spot sell or leveraged short)
      if (data.type === "market") {
        const order: OPEN_ORDERS = {
          orderId,
          type: "market",
          side: "sell",
          QTY: qty,
          TP: data.TP !== undefined ? p(data.TP) : undefined,
          SL: data.SL !== undefined ? p(data.SL) : undefined,
          userId: data.userId,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: buyPriceScaled,
          leverage: leverageUsed,
          margin:
            leverageUsed > 1
              ? Math.floor((qty * buyPriceScaled) / leverageUsed)
              : undefined,
        } as OPEN_ORDERS;

        registerOpenOrder(order);

        // STOP LOSS for shorts -> max-heap
        if (data.SL !== undefined && data.SL > 0) {
          if (!this.stopLossShortMap.has(market))
            this.stopLossShortMap.set(
              market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.stopLossShortMap
            .get(market)!
            .push({ orderId, price: p(data.SL) });
        }
        // TAKE PROFIT for shorts -> max-heap
        if (data.TP !== undefined && data.TP > 0) {
          if (!this.takeProfitShortMap.has(market))
            this.takeProfitShortMap.set(
              market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitShortMap
            .get(market)!
            .push({ orderId, price: p(data.TP) });
        }

        if (!this.leveragedShortMap.has(market))
          this.leveragedShortMap.set(
            market,
            new Heap<HeapNode>((a, b) => b.price - a.price)
          );
        this.leveragedShortMap
          .get(market)!
          .push({ orderId, price: buyPriceScaled });

        // settle depending on leverage or spot:
        const assets = user.assets || {};
        const borrowedAssets: Record<string, any> = user.borrowedAssets || {};
        const balanceAfter = { ...user.balance } as Balance;

        if (leverageUsed === 1) {
          // SPOT SELL: user must own asset (validated earlier). Deduct asset and credit USD immediately
          assets[market] = {
            side: assets[market]?.side || "long",
            qty: (assets[market]?.qty || 0) - qty,
            leverage: 1,
            entryPrice: assets[market]?.entryPrice || buyPriceScaled,
          };

          const credit = Math.floor(qty * buyPriceScaled);
          balanceAfter.usd = (balanceAfter.usd || 0) + credit;
          // no locked_usd change for spot sell
        } else {
          // LEVERAGED SHORT: we recorded margin earlier by LockBalance
          // At execution, user is short: update borrowedAssets and consume margin from locked_usd
          borrowedAssets[market] = {
            side: "short",
            qty: (borrowedAssets[market]?.qty || 0) + qty,
            leverage: leverageUsed,
            entryPrice: buyPriceScaled,
          };

          const margin = Math.floor((qty * buyPriceScaled) / leverageUsed);
          balanceAfter.locked_usd = (balanceAfter.locked_usd || 0) - margin;
        }

        await this.updateUserData(data.userId, {
          balance: balanceAfter as Balance,
          assets,
          borrowedAssets,
        });
        return orderId;
      }
    }

    throw new Error("Unsupported branch / invalid input");
  }
}
