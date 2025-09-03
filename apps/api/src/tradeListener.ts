import PrismaClient from "@repo/primary-db";
import { redis, subscriber } from "@repo/shared-redis";
import { Engine, OPEN_ORDERS, p, u } from "./engine/index.js";
import {  MESSAGE_QUEUE } from "@repo/common";

async function liquidateOrder(
  order: OPEN_ORDERS,
  buyPrice: number, // scaled
  sellPrice: number // scaled
) {
  const userData = await redis.hGetAll(order.userId);
  if (!userData || !userData.balance) {
    console.error("User data not found for userId:", order.userId);
    return;
  }

  const userBalance = JSON.parse(userData.balance);
  const assets = userData.assets ? JSON.parse(userData.assets) : {};
  const borrowedAssets = userData.borrowedAssets
    ? JSON.parse(userData.borrowedAssets)
    : {};

  let pnlScaled = 0;
  let newUsdScaled = userBalance.usd;

  const closePrice = order.side === "buy" ? buyPrice : sellPrice; // scaled

  if (order.leverage && order.leverage > 1) {
    // For leveraged positions, user PnL (scaled) = (closePrice - entryPrice) * qty
    if (order.side === "buy") {
      pnlScaled = Math.floor((closePrice - order.openPrice) * order.QTY);
      // reduce borrowedAssets qty
      borrowedAssets[order.market] =
        (borrowedAssets[order.market] || 0) - order.QTY;
      // release nothing to usd directly; margin was consumed earlier or is in locked_usd
    } else {
      pnlScaled = Math.floor((order.openPrice - closePrice) * order.QTY);
      borrowedAssets[order.market] =
        (borrowedAssets[order.market] || 0) - order.QTY;
    }

    newUsdScaled = newUsdScaled + pnlScaled; // pnl can be negative

    // If margin was previously consumed from locked_usd, ensure we release the margin back
    const marginScaled = order.margin || 0;
    if (marginScaled && marginScaled > 0) {
      // return margin back to user's usd
      newUsdScaled = newUsdScaled + marginScaled;
    }
  } else {
    // Spot trade: closing means converting the asset back to usd
    if (order.side === "buy") {
      // user sells the asset at close price and receives USD
      const credit = Math.floor(order.QTY * closePrice);
      newUsdScaled = newUsdScaled + credit;

      // reduce asset holdings
      assets[order.market] = {
        ...(assets[order.market] || {}),
        qty: (assets[order.market]?.qty || 0) - order.QTY,
      };
    } else {
      // Spot SELL -> they sold earlier and were credited. Closing a spot sell doesn't make sense here.
      // handle gracefully: compute pnl against recorded openPrice
      pnlScaled = Math.floor((order.openPrice - closePrice) * order.QTY);
      newUsdScaled = newUsdScaled + pnlScaled;
    }
  }

  // Persist new balances
  const newBalance = {
    ...userBalance,
    usd: newUsdScaled,
    // locked_usd should already be updated at order open/close; ensure non-negative
    locked_usd: Math.max(0, userBalance.locked_usd || 0),
  };

  await redis.hSet(order.userId, {
    ...userData,
    balance: JSON.stringify(newBalance),
    assets: JSON.stringify(assets),
    borrowedAssets: JSON.stringify(borrowedAssets),
  });

  // Move order to CLOSED
  Engine.OPEN_ORDERS.delete(order.orderId);
  Engine.CLOSED_ORDERS.set(order.orderId, {
    ...order,
    closePrice,
    pnl: u(pnlScaled),
  });

  redis.lPush(
    MESSAGE_QUEUE,
    JSON.stringify({
      message: {
        subject: `Order ${order.orderId} closed`,
        html: `Your order ${order.orderId} for ${order.market} (${order.side}) has been closed at price ${u(
          closePrice
        )}. PnL: ${u(pnlScaled)} USD.`,
      },
      to: userData.email,
    })
  );

  console.log(
    `✅ Order ${order.orderId} for ${order.market} (${order.side}) closed at ${u(closePrice)}, PnL: ${u(pnlScaled)}`
  );
}

async function startTradeListening() {
  const assets = await PrismaClient.prisma.asset.findMany();
  const assetsSymbol = assets.map((asset) => asset.symbol.toLowerCase());

  if (!assetsSymbol.length) {
    console.warn("No assets found in the database to listen for trades.");
    return;
  }

  subscriber.subscribe(assetsSymbol, async (message, channel) => {
    const data = JSON.parse(message);
    const key = `trade:${data.market.toLowerCase()}`;
    await redis.set(key, JSON.stringify(data));

    const { market, buy, sell } = data;
    const buyPrice = p(buy);
    const sellPrice = p(sell);

    /** ---------- STOP LOSS (LONG) ---------- */
    const stopLossLongHeap = Engine.stopLossLongMap.get(market);
    if (stopLossLongHeap) {
      while (stopLossLongHeap.size() > 0) {
        const top = stopLossLongHeap.peek();
        if (!top) break;
        // trigger if current buyPrice <= stopLoss (stoploss for long triggers when price drops below SL)
        if (buyPrice > top.price) break;
        const { orderId } = stopLossLongHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "buy") {
          console.log(
            "Liquidating stop loss long order:",
            orderId,
            top.price,
            buyPrice
          );
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- TAKE PROFIT (LONG) ---------- */
    const takeProfitLongHeap = Engine.takeProfitLongMap.get(market);
    if (takeProfitLongHeap) {
      while (takeProfitLongHeap.size() > 0) {
        const top = takeProfitLongHeap.peek();
        if (!top) break;
        // TP for long triggers when buyPrice >= TP
        if (buyPrice < top.price) break;
        const { orderId } = takeProfitLongHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "buy") {
          console.log(
            "Liquidating take profit long order:",
            orderId,
            top.price,
            buyPrice
          );
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- LEVERAGED LONG (liquidation) ---------- */
    const leveragedLongHeap = Engine.leveragedLongMap.get(market);
    if (leveragedLongHeap) {
      while (leveragedLongHeap.size() > 0) {
        const top = leveragedLongHeap.peek();
        if (!top) break;
        // For leveraged long, liquidation triggers when buyPrice <= liquidation threshold
        if (buyPrice > top.price) break;
        const { orderId } = leveragedLongHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "buy") {
          console.log(
            "Liquidating leveraged long order:",
            orderId,
            top.price,
            buyPrice
          );
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- STOP LOSS (SHORT) ---------- */
    const stopLossShortHeap = Engine.stopLossShortMap.get(market);
    if (stopLossShortHeap) {
      while (stopLossShortHeap.size() > 0) {
        const top = stopLossShortHeap.peek();
        if (!top) break;
        // stoploss for short triggers when sellPrice >= SL
        if (sellPrice < top.price) break;
        const { orderId } = stopLossShortHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "sell") {
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- TAKE PROFIT (SHORT) ---------- */
    const takeProfitShortHeap = Engine.takeProfitShortMap.get(market);
    if (takeProfitShortHeap) {
      while (takeProfitShortHeap.size() > 0) {
        const top = takeProfitShortHeap.peek();
        if (!top) break;
        // TP for short triggers when sellPrice <= TP
        if (sellPrice > top.price) break;
        const { orderId } = takeProfitShortHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "sell") {
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- LEVERAGED SHORT (liquidation) ---------- */
    const leveragedShortHeap = Engine.leveragedShortMap.get(market);
    if (leveragedShortHeap) {
      while (leveragedShortHeap.size() > 0) {
        const top = leveragedShortHeap.peek();
        if (!top) break;
        // For leveraged short, liquidation triggers when sellPrice >= liquidation threshold
        if (sellPrice > top.price) break;
        const { orderId } = leveragedShortHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "sell") {
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }
  });
}

export default startTradeListening;
