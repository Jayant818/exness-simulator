import "dotenv/config";

export default {
  databaseUrl: process.env.DATABASE_URL,
  dir: "migrations",
  migrationsTable: "pgmigrations",
  decamelize: true,
  direction: "up",
};
