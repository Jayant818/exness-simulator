import PrismaClient from "@repo/primary-db";
import { redis } from "@repo/shared-redis";

async function startTradeListening() {
  // Get all the assests from the database
  const assets = await PrismaClient.prisma.asset.findMany();

  // Get there symbols
  const assetsSymbol = assets.map((asset) => asset.symbol.toLowerCase());

  if (!assetsSymbol.length) {
    console.warn("No assets found in the database to listen for trades.");
    return;
  }

  redis.subscribe(assetsSymbol, (message, channel) => {
    const data = JSON.parse(message);
    console.log("Trade data:", data);
    // Here we will process the trade data and update the database accordingly
  });
}

export default startTradeListening;
