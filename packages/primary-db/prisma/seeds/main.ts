import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

const initialData = [
  {
    name: "BTC-USD",
    symbol: "BTCUSDT",
    imgUrl: "https://bitcoin.org/img/icons/opengraph.png?1749679667",
    decimals: 8,
  },
  {
    name: "ETH",
    symbol: "ETHUSDT",
    imgUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/1027.png",
    decimals: 8,
  },
  {
    name: "LTC",
    symbol: "LTCUSDT",
    imgUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/2.png",
    decimals: 8,
  },
  {
    name: "XRP",
    symbol: "XRPUSDT",
    imgUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/52.png",
    decimals: 6,
  },
  {
    name: "Sol",
    symbol: "SOLUSDT",
    imgUrl: "https://s2.coinmarketcap.com/static/img/coins/64x64/5426.png",
    decimals: 6,
  },
];

async function main() {
  try {
    console.log("Seeding initial data...");

    for (const market of initialData) {
      const result = await prisma.asset.upsert({
        where: { symbol: market.symbol },
        update: {
          decimals: market.decimals,
        },
        create: market,
      });
      console.log(`Upserted asset:`, result);
    }

    // Verify the data exists
    const count = await prisma.asset.count();
    console.log(`Asset count in database: ${count}`);
    const assets = await prisma.asset.findMany();
    console.log("All assets:", assets);
  } catch (error) {
    console.error("Error seeding initial data:", error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Disconnected from database");
    await prisma.$disconnect();
  });
