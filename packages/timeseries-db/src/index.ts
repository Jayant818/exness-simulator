import pg from "pg";

const globalForPool = globalThis;

// @ts-ignore
const pool = globalForPool.pool || new pg.Pool({});

// @ts-ignore
if (process.env.NODE_ENV !== "production") globalForPool.pool = pool;

export { pool };
