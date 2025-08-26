import "dotenv/config";
import { createClient } from "redis";
import { pool } from "@repo/db";

async function main() {
  const tradeData = [];

  const redisClient = await createClient().connect();

  while (true) {
    const data = await redisClient.brPop("POLLING_ENGINE_QUEUE_NAME", 0);
    if (data) {
      tradeData.push(JSON.parse(data.element));
      if (tradeData.length >= 10) {
        const query = ``;

        tradeData.length = 0;
      }
    }
  }
}

main();
