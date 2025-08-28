import "dotenv/config";
import { Router } from "express";
import { pool } from "@repo/db";

export const candlesRouter = Router();

// Whitelist of valid intervals and their corresponding table names
const validIntervals = {
  "1m": "candles_1m",
  "5m": "candles_5m",
  "1h": "candles_1h",
  "1d": "candles_1d",
};

candlesRouter.get("/", (req, res) => {
  const { symbol, interval, startTime, endTime } = req.query;

  if (!symbol || !interval) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  // 1. Validate the interval and get the correct table name
  const tableName = validIntervals[interval as keyof typeof validIntervals];
  if (!tableName) {
    return res.status(400).json({ error: "Invalid interval" });
  }

  const params: any[] = [symbol];
  // 2. Use the validated tableName in the query
  let query = `
    SELECT bucket AS time, open, high, low, close, volume
    FROM ${tableName}
    WHERE symbol = $1
  `;

  if (startTime) {
    params.push(new Date(startTime as string));
    query += ` AND bucket >= $${params.length}`;
  }

  if (endTime) {
    params.push(new Date(endTime as string));
    query += `AND bucket <= $${params.length}`;
  }

  query += `
    ORDER BY bucket DESC
  `;

  pool
    .query(query, params)
    .then((result: any) => {
      res.json(result.rows);
    })
    .catch((error: any) => {
      console.error("Error fetching candles:", error);
      res.status(500).json({ error: "Internal server error" });
    });
});
