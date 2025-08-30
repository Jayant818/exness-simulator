import PrismaClient from "@repo/primary-db";
import { redis, subscriber } from "@repo/shared-redis";

async function startTradeListening() {
  // Get all the assests from the database
  const assets = await PrismaClient.prisma.asset.findMany();

  // Get there symbols
  const assetsSymbol = assets.map((asset) => asset.symbol.toLowerCase());

  if (!assetsSymbol.length) {
    console.warn("No assets found in the database to listen for trades.");
    return;
  }

  subscriber.subscribe(assetsSymbol, async (message, channel) => {
    const data = JSON.parse(message);
    const key = `trade:${data.market}`;

    await redis.hSet(key, data);
  });
}

export default startTradeListening;
