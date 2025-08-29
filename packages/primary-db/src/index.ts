// IN development mode , duriing hot reload the new prisma client instance will be created
// this will lead to too many connections error
// to avoid that we will use globalThis to store the prisma client instance
// globalThis is a nodejs Object that persists across hot reloads
import { PrismaClient } from "@prisma/client";

declare global {
  var prisma: PrismaClient | undefined;
}

export const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalThis.prisma = prisma;
}

export default prisma;
