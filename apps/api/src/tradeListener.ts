import PrismaClient from "@repo/primary-db";
import { redis, subscriber } from "@repo/shared-redis";
import { Engine, OPEN_ORDERS } from "./engine/index.js";
import { IOpenOrderRes } from "./routes/trade.js";

async function liquidateOrder(order: OPEN_ORDERS, price: number) {
  const userData = await redis.hGetAll(order.userId);
  if (!userData || !userData.balance) {
    console.error("User data not found for userId:", order.userId);
    return;
  }

  let userBalance = JSON.parse(userData.balance);
  let pnl: number = 0;
  let newUsdBalance: number;

  if (order.leverage) {
    // Futures / margin trade
    if (order.side === "buy") {
      pnl = (price - order.openPrice) * order.QTY * order.leverage;
    } else {
      pnl = (order.openPrice - price) * order.QTY * order.leverage;
    }
    newUsdBalance = userBalance.usd + pnl;
  } else {
    // Spot trade
    pnl = (price - order.openPrice) * order.QTY; // ✅ keep pnl consistent
    newUsdBalance = userBalance.usd + order.QTY * price;
  }

  const newBalance = {
    ...userBalance,
    usd: newUsdBalance,
    ...(!order.leverage && {
      [order.market]: (userBalance[order.market] || 0) - order.QTY,
    }),
  };

  const positions = userData.positions ? JSON.parse(userData.positions) : {};

  if (order.leverage) {
    positions[order.market] = (positions[order.market] || 0) - order.QTY;
  }

  await redis.hSet(order.userId, {
    ...userData,
    balance: JSON.stringify(newBalance),
    positions: JSON.stringify(positions),
  });

  // Move order to CLOSED
  Engine.OPEN_ORDERS.delete(order.orderId);
  Engine.CLOSED_ORDERS.set(order.orderId, {
    ...order,
    closePrice: price,
    pnl,
  });
}

async function startTradeListening() {
  // Get all the assests from the database
  const assets = await PrismaClient.prisma.asset.findMany();

  // Get there symbols
  const assetsSymbol = assets.map((asset) => asset.symbol.toLowerCase());

  console.log("Starting trade listener for assets:", assetsSymbol);
  if (!assetsSymbol.length) {
    console.warn("No assets found in the database to listen for trades.");
    return;
  }

  subscriber.subscribe(assetsSymbol, async (message, channel) => {
    const data = JSON.parse(message);
    const key = `trade:${data.market}`;
    await redis.hSet(key, data);

    console.log(`Received trade data for ${data.market}:`, data);

    // Received trade data for BTCUSDT: {
    //   buy: 114013.18950000001,
    //   sell: 103154.7905,
    //   market: 'BTCUSDT',
    //   time: 1756554167548
    // }

    const { market, buy: price } = data;

    // Check if STOP LOSS is hit for any order in that market
    // min heap so the lowest stop loss price is at the top
    const stopLossPrices = Engine.stopLossMap.get(market);

    if (stopLossPrices) {
      while (stopLossPrices.size() > 0) {
        const top = stopLossPrices.peek();
        if (!top) break;
        if (top.price > price) break;

        const { orderId } = stopLossPrices.pop()!;

        const order = Engine.OPEN_ORDERS.get(orderId);
        if (order) {
          // Ideally this should be done in a queue
          liquidateOrder(order, price);
        }
      }
    }

    // For take Profit
    const takeProfitHeap = Engine.takeProfitMap.get(market);

    if (takeProfitHeap) {
      while (takeProfitHeap.size() > 0) {
        const top = takeProfitHeap.peek();
        if (!top) break;
        if (top.price < price) break; // stop if price hasn't reached TP threshold

        const { orderId } = takeProfitHeap.pop()!;
        const order = Engine.OPEN_ORDERS.get(orderId);

        if (order) {
          // Ideally this should also go to a queue
          liquidateOrder(order, price);
        }
      }
    }

    // For Leverage Orders
    const LeveragedOrderHeap = Engine.leveragedOrderMap.get(market);

    if (LeveragedOrderHeap) {
      while (LeveragedOrderHeap.size() > 0) {
        const top = LeveragedOrderHeap.peek();
        if (!top || top.price < price) break;

        const { orderId } = LeveragedOrderHeap.pop()!;

        const order = Engine.OPEN_ORDERS.get(orderId);

        if (order) {
          liquidateOrder(order, price);
        }
      }
    }

    // Here what we can do is First check for buy then market order then with leverage and without leverage

    // For Pending Orders , Both with and without leverage can be implemented in the same way
    // For Limit Order - as they are not executed yet we will check if the price is less than or equal to the limit price for buy and greater than or equal to the limit price for sell
  });
}

export default startTradeListening;
