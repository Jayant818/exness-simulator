import { redis } from "@repo/shared-redis";
import { IClosedOrderRes, IOpenOrderRes } from "../routes/trade.js";
import { Heap } from "heap-js";
import * as crypto from "crypto";

const SCALE = 100;
const p = (x: number | string) => Math.round(Number(x) * SCALE);
const u = (x: number | string) => Number(x) / SCALE;

interface HeapNode {
  orderId: string;
  price: number; // scaled by SCALE
}

type Balance = {
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
      assets: raw.assets ? JSON.parse(raw.assets) : {}, // { market: { side, qty, leverage, entryPrice, margin } }
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

  public static async LockBalance({
    userId,
    amountToLock,
  }: {
    amountToLock: number;
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

  public static async process(data: {
    type: "market" | "limit";
    side: "buy" | "sell";
    QTY: number;
    TP?: number;
    SL?: number;
    market: string;
    balance: string;
    userId: string;
    leverage: number; // 1 means spot/no-leverage
  }) {
    const tradeData = await redis.hGetAll(`trade:${data.market}`);
    if (!tradeData || !tradeData.buy || !tradeData.sell) {
      throw new Error("Market data not found");
    }
    const buyPriceScaled = p(tradeData.buy);
    const sellPriceScaled = p(tradeData.sell);

    let user = await this.getUserData(data.userId);
    let bal = user.balance as Balance;

    const leverageUsed = data.leverage ? Number(data.leverage) : 1;
    if (leverageUsed <= 0 || leverageUsed > 40)
      throw new Error("Invalid leverage");

    // Decide whether we need to lock USD margin:
    // - BUY (spot or leveraged) -> lock USD (full notional if leverage=1, else margin)
    // - SELL spot (leverage=1) -> no USD lock; require asset qty available
    // - SELL leveraged (leverage>1) -> lock USD margin similar to buy leveraged
    let amountToLock = 0;
    if (data.side === "buy") {
      amountToLock =
        leverageUsed > 1
          ? Math.floor((data.QTY * buyPriceScaled) / leverageUsed)
          : data.QTY * buyPriceScaled;
      await this.LockBalance({ userId: data.userId, amountToLock });
    } else {
      // sell
      if (leverageUsed > 1) {
        // short with margin: lock USD margin computed using sell price (we'll use sellPriceScaled)
        amountToLock = Math.floor((data.QTY * sellPriceScaled) / leverageUsed);
        await this.LockBalance({ userId: data.userId, amountToLock });
      } else {
        // spot sell: ensure user has enough asset quantity (no USD lock)
        const assets = user.assets || {};
        const holding = assets[data.market]?.qty || 0;
        if (holding < data.QTY) {
          throw new Error("Insufficient asset balance for sell");
        }
      }
    }

    // reload user after lock (if lock happened)
    user = await this.getUserData(data.userId);
    bal = user.balance as Balance;

    const orderId = crypto.randomUUID();

    /** ---------- BUY (LONG) ---------- */
    if (data.side === "buy") {
      // MARKET & NO LEVERAGE => immediate spot buy
      if (data.type === "market" && leverageUsed === 1) {
        this.OPEN_ORDERS.set(orderId, {
          orderId,
          type: "market",
          side: "buy",
          QTY: data.QTY,
          TP: data.TP !== undefined ? p(data.TP) : undefined,
          SL: data.SL !== undefined ? p(data.SL) : undefined,
          userId: data.userId,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: buyPriceScaled,
        });

        if (!this.userOrderMap.has(data.userId))
          this.userOrderMap.set(data.userId, new Set());
        this.userOrderMap.get(data.userId)!.add(orderId);

        console.log("Buy order", data);
        console.log("this.OPEN_ORDERS", this.OPEN_ORDERS);

        if (data.SL !== undefined) {
          if (!this.stopLossLongMap.has(data.market))
            this.stopLossLongMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => a.price - b.price)
            );
          this.stopLossLongMap
            .get(data.market)!
            .push({ orderId, price: p(data.SL) });
        }
        if (data.TP !== undefined) {
          if (!this.takeProfitLongMap.has(data.market))
            this.takeProfitLongMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitLongMap
            .get(data.market)!
            .push({ orderId, price: p(data.TP) });
        }

        // consume locked USD -> credit assets
        const newBal: Balance = {
          ...bal,
          locked_usd: bal.locked_usd - data.QTY * buyPriceScaled,
        };

        const assets = user.assets || {};
        assets[data.market] = {
          side: "long",
          qty: (assets[data.market]?.qty || 0) + data.QTY,
          leverage: 1,
          entryPrice: buyPriceScaled,
          margin: data.QTY * buyPriceScaled,
        };

        await this.updateUserData(data.userId, { balance: newBal, assets });
        return orderId;
      }

      // LIMIT no-leverage -> pending
      // TODO: logic is incorrect maybe
      // if (data.type === "limit" && leverageUsed === 1) {
      //   this.PENDING_ORDERS.set(orderId, {
      //     orderId,
      //     type: "limit",
      //     side: "buy",
      //     QTY: data.QTY,
      //     TP: data.TP !== undefined ? p(data.TP) : undefined,
      //     SL: data.SL !== undefined ? p(data.SL) : undefined,
      //     userId: data.userId,
      //     market: data.market,
      //     createdAt: new Date().toISOString(),
      //     openPrice: buyPriceScaled,
      //   });
      //   if (!this.userOrderMap.has(data.userId))
      //     this.userOrderMap.set(data.userId, new Set());
      //   this.userOrderMap.get(data.userId)!.add(orderId);

      //   const newBal: Balance = {
      //     ...bal,
      //     locked_usd: bal.locked_usd - data.QTY * buyPriceScaled,
      //   };
      //   await this.updateUserData(data.userId, { balance: newBal });
      //   return orderId;
      // }

      // MARKET leveraged long
      if (data.type === "market" && leverageUsed > 1) {
        const totalQty = Number(data.QTY) || 0;
        if (!totalQty) throw new Error("Invalid qty");

        const borrowedAmount = totalQty * buyPriceScaled;
        const margin = Math.floor(borrowedAmount / leverageUsed);
        if (margin > bal.usd + bal.locked_usd)
          throw new Error("Insufficient margin");

        this.OPEN_ORDERS.set(orderId, {
          market: data.market,
          openPrice: buyPriceScaled,
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
        });
        if (!this.userOrderMap.has(data.userId))
          this.userOrderMap.set(data.userId, new Set());
        this.userOrderMap.get(data.userId)!.add(orderId);

        if (data.SL !== undefined) {
          if (!this.stopLossLongMap.has(data.market))
            this.stopLossLongMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => a.price - b.price)
            );
          this.stopLossLongMap
            .get(data.market)!
            .push({ orderId, price: p(data.SL) });
        }
        if (data.TP !== undefined) {
          if (!this.takeProfitLongMap.has(data.market))
            this.takeProfitLongMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitLongMap
            .get(data.market)!
            .push({ orderId, price: p(data.TP) });
        }

        if (!this.leveragedLongMap.has(data.market))
          this.leveragedLongMap.set(
            data.market,
            new Heap<HeapNode>((a, b) => b.price - a.price)
          );
        this.leveragedLongMap
          .get(data.market)!
          .push({ orderId, price: buyPriceScaled });

        // TODO: as user buy long with leverage, Ideally we should track assets acquired thorugh leverage seperately
        const assets = user.assets || {};
        assets[data.market] = {
          side: "long",
          qty: totalQty,
          leverage: leverageUsed,
          entryPrice: buyPriceScaled,
          margin,
        };

        await this.updateUserData(data.userId, { assets });
        return orderId;
      }

      // LIMIT leveraged long -> pending
      // if (data.type === "limit" && leverageUsed > 1) {
      //   const totalQty = Number(data.QTY) || 0;
      //   if (!totalQty) throw new Error("Invalid qty");

      //   const borrowedAmount = totalQty * buyPriceScaled;
      //   const margin = Math.floor(borrowedAmount / leverageUsed);
      //   if (margin > bal.usd + bal.locked_usd)
      //     throw new Error("Insufficient margin");

      //   this.PENDING_ORDERS.set(orderId, {
      //     orderId,
      //     type: "limit",
      //     side: "buy",
      //     QTY: totalQty,
      //     TP: data.TP !== undefined ? p(data.TP) : undefined,
      //     userId: data.userId,
      //     SL: data.SL !== undefined ? p(data.SL) : undefined,
      //     market: data.market,
      //     createdAt: new Date().toISOString(),
      //     openPrice: buyPriceScaled,
      //   });
      //   if (!this.userOrderMap.has(data.userId))
      //     this.userOrderMap.set(data.userId, new Set());
      //   this.userOrderMap.get(data.userId)!.add(orderId);

      //   const assets = user.assets || {};
      //   assets[data.market] = {
      //     side: "long",
      //     qty: totalQty,
      //     leverage: leverageUsed,
      //     entryPrice: buyPriceScaled,
      //     margin,
      //   };

      //   await this.updateUserData(data.userId, { assets });
      //   return orderId;
      // }
    }

    /** ---------- SELL (SHORT) ---------- */
    if (data.side === "sell") {
      if (data.type === "market") {
        if (!data.QTY || data.QTY <= 0)
          throw new Error("Quantity must be greater than zero");

        // create order record (entry price is sellPriceScaled)
        this.OPEN_ORDERS.set(orderId, {
          orderId,
          type: "market",
          side: "sell",
          QTY: data.QTY,
          TP: data.TP !== undefined ? p(data.TP) : undefined,
          SL: data.SL !== undefined ? p(data.SL) : undefined,
          userId: data.userId,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: sellPriceScaled,
          leverage: leverageUsed,
          margin:
            leverageUsed > 1
              ? Math.floor((data.QTY * sellPriceScaled) / leverageUsed)
              : data.QTY * sellPriceScaled,
        });

        if (!this.userOrderMap.has(data.userId))
          this.userOrderMap.set(data.userId, new Set());
        this.userOrderMap.get(data.userId)!.add(orderId);

        // STOP LOSS for shorts -> max-heap
        if (data.SL !== undefined) {
          if (!this.stopLossShortMap.has(data.market))
            this.stopLossShortMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.stopLossShortMap
            .get(data.market)!
            .push({ orderId, price: p(data.SL) });
        }
        // TAKE PROFIT for shorts -> max-heap (we pop highest TP first as price falls)
        if (data.TP !== undefined) {
          if (!this.takeProfitShortMap.has(data.market))
            this.takeProfitShortMap.set(
              data.market,
              new Heap<HeapNode>((a, b) => b.price - a.price)
            );
          this.takeProfitShortMap
            .get(data.market)!
            .push({ orderId, price: p(data.TP) });
        }

        // leveraged short storage
        if (!this.leveragedShortMap.has(data.market))
          this.leveragedShortMap.set(
            data.market,
            new Heap<HeapNode>((a, b) => b.price - a.price)
          );
        this.leveragedShortMap
          .get(data.market)!
          .push({ orderId, price: sellPriceScaled });

        // now settle depending on leverage or spot:
        const assets = user.assets || {};
        const borrowedAssets: Record<string, number> =
          user.borrowedAssets || {};
        const balanceAfter = { ...user.balance } as Balance;

        if (leverageUsed === 1) {
          // SPOT SELL: user must own asset (we validated earlier)
          // Deduct asset and credit USD immediately (no margin)
          assets[data.market] = {
            side: assets[data.market]?.side || "long",
            qty: (assets[data.market]?.qty || 0) - data.QTY,
            leverage: 1,
            entryPrice: assets[data.market]?.entryPrice || sellPriceScaled,
            margin: Math.max(
              0,
              (assets[data.market]?.margin || 0) - data.QTY * sellPriceScaled
            ),
          };

          balanceAfter.usd =
            (balanceAfter.usd || 0) + data.QTY * sellPriceScaled;
          // no locked_usd change because we didn't lock USD for sells
        } else {
          // LEVERAGED SHORT: we recorded margin earlier by LockBalance (USD locked)
          // At execution, user is short: update borrowedAssets and leave margin logic to risk/positions
          borrowedAssets[data.market] =
            (borrowedAssets[data.market] || 0) + data.QTY;
          // positions / assets will be handled via assets/positions field as needed
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
