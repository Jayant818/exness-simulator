import PrismaClient from "@repo/primary-db";
import { redis, subscriber } from "@repo/shared-redis";
import { Engine, OPEN_ORDERS, p } from "./engine/index.js";

async function liquidateOrder(
  order: OPEN_ORDERS,
  buyPrice: number,
  sellPrice: number
) {
  const userData = await redis.hGetAll(order.userId);
  if (!userData || !userData.balance) {
    console.error("User data not found for userId:", order.userId);
    return;
  }

  let userBalance = JSON.parse(userData.balance);
  let pnl = 0;
  let newUsdBalance = userBalance.usd;
  const closePrice = order.side === "buy" ? buyPrice : sellPrice; // ✅ correct close price

  if (order.leverage && order.leverage > 1) {
    // Futures / margin trade
    // don't multiple it with leverage here as pnl is already magnified by leverage
    if (order.side === "buy") {
      pnl = (closePrice - order.openPrice) * order.QTY;
    } else {
      pnl = (order.openPrice - closePrice) * order.QTY;
    }
    newUsdBalance = userBalance.usd + pnl;
  } else {
    // Spot trade
    if (order.side === "buy") {
      pnl = (closePrice - order.openPrice) * order.QTY;
      // need to add also the margin value also
      newUsdBalance = userBalance.usd + order.QTY * closePrice;
    } else {
      // Spot SELL — user sells asset that he already own, receives USD
      // the only thing changed is PNL and user gets his asset back
      pnl = (order.openPrice - closePrice) * order.QTY;
      newUsdBalance = userBalance.usd + pnl;
    }
  }

  const newBalance = {
    ...userBalance,
    usd: newUsdBalance,
  };

  const assets = userData.assets ? JSON.parse(userData.assets) : {};
  const borrowedAssets = userData.borrowedAssets
    ? JSON.parse(userData.borrowedAssets)
    : {};

  if (!order.leverage || order.leverage <= 1) {
    if (order.side === "buy") {
      newBalance[order.market] = (userBalance[order.market] || 0) - order.QTY;
    }
  } else {
    // For leveraged trades, adjust borrowedAssets
    if (order.side === "buy") {
      borrowedAssets[order.market] =
        (borrowedAssets[order.market] || 0) + order.QTY;
    } else {
      borrowedAssets[order.market] = (borrowedAssets[order.market] || 0) - order.QTY;
    }
  }

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
    pnl,
  });

  console.log(
    `✅ Order ${order.orderId} for ${order.market} (${order.side}) closed at ${closePrice}, PnL: ${pnl}`
  );
}

async function startTradeListening() {
  const assets = await PrismaClient.prisma.asset.findMany();
  const assetsSymbol = assets.map((asset) => asset.symbol.toLowerCase());

  // console.log("Starting trade listener for assets:", assetsSymbol);
  if (!assetsSymbol.length) {
    console.warn("No assets found in the database to listen for trades.");
    return;
  }

  subscriber.subscribe(assetsSymbol, async (message, channel) => {
    const data = JSON.parse(message);
    const key = `trade:${data.market.toLowerCase()}`;
    await redis.set(key, JSON.stringify(data));
    // console.log("Received trade data on channel:", channel, data);

    const { market, buy, sell } = data;
    let buyPrice = p(buy);
    let sellPrice = p(sell);

    /** ---------- STOP LOSS (LONG) ---------- */
    const stopLossLongHeap = Engine.stopLossLongMap.get(market);
    if (stopLossLongHeap) {
      // console.log("Processing stop loss long orders for", market);
      while (stopLossLongHeap.size() > 0) {
        const top = stopLossLongHeap.peek();
        if (!top) break;
        // console.log("Top SL Long:", top);
        // console.log("Current Buy Price:", buyPrice);
        if (buyPrice > top.price) break; // trigger only if current <= stopLoss
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
      // console.log("Processing take profit long orders for", market);

      while (takeProfitLongHeap.size() > 0) {
        const top = takeProfitLongHeap.peek();
        if (!top) break;
        if (buyPrice < top.price) break; // trigger only if current >= TP
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

    /** ---------- LEVERAGED LONG ---------- */
    const leveragedLongHeap = Engine.leveragedLongMap.get(market);
    if (leveragedLongHeap) {
      // console.log("Processing leveraged long orders for", market);
      while (leveragedLongHeap.size() > 0) {
        const top = leveragedLongHeap.peek();
        if (!top) break;
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
      // console.log("Processing stop loss short orders for", market);
      while (stopLossShortHeap.size() > 0) {
        const top = stopLossShortHeap.peek();
        if (!top) break;
        if (sellPrice < top.price) break; // trigger only if current >= stopLoss
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
      console.log("Processing take profit short orders for", market);
      while (takeProfitShortHeap.size() > 0) {
        const top = takeProfitShortHeap.peek();
        if (!top) break;
        if (sellPrice > top.price) break; // trigger only if current <= TP
        const { orderId } = takeProfitShortHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order?.side === "sell") {
          await liquidateOrder(order, buyPrice, sellPrice);
        }
      }
    }

    /** ---------- LEVERAGED SHORT ---------- */
    const leveragedShortHeap = Engine.leveragedShortMap.get(market);
    if (leveragedShortHeap) {
      console.log("Processing leveraged short orders for", market);
      while (leveragedShortHeap.size() > 0) {
        const top = leveragedShortHeap.peek();
        if (!top) break;
        if (sellPrice > top.price) break; // trigger only if current <= liquidation
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
