import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["query", "info", "warn", "error"] });

const initialData = [
  {
    name: "BTC-USD",
    symbol: "BTCUSDT",
    imgUrl: "https://bitcoin.org/img/icons/opengraph.png?1749679667",
  },
];

async function main() {
  try {
    console.log("Seeding initial data...");

    for (const market of initialData) {
      const result = await prisma.asset.upsert({
        where: { symbol: market.symbol },
        update: {},
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
