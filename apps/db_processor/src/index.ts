import "dotenv/config";
import { createClient } from "redis";
import { pool } from "@repo/db";
import { POLLING_ENGINE_QUEUE_NAME } from "@repo/common";

async function main() {
  const tradeData = [];

  const redisClient = await createClient().connect();

  while (true) {
    const data = await redisClient.brPop(POLLING_ENGINE_QUEUE_NAME, 0);
    console.log("Received data from Redis:", data);
    if (data) {
      const trade = JSON.parse(data.element);
      const processedTrade = {
        tradeId: trade.t,
        symbol: trade.s,
        price: parseFloat(trade.p),
        quantity: parseFloat(trade.q),
        tradeTime: new Date(trade.T),
        isBuyerMaker: trade.m,
      };
      tradeData.push(processedTrade);
      console.log("Processed trade:", processedTrade);
      console.log("Current batch size:", tradeData.length);
      if (tradeData.length >= 100) {
        try {
          console.log("Trying to insert trades into DB...");
          const query = `
            INSERT INTO trades ("tradeId", symbol, price, quantity, time)
            VALUES ${tradeData.map((trade) => `(${trade.tradeId}, '${trade.symbol}', ${trade.price}, ${trade.quantity}, '${trade.tradeTime.toISOString()}')`).join(", ")};
          `;

          await pool.query(query);

          tradeData.length = 0;
        } catch (error) {
          console.error("Error inserting trades:", error);
        }
      }
    }
  }
}

main();
