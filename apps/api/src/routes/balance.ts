import { redis } from "@repo/shared-redis";
import { Router } from "express";

export const balanceRouter = Router();

balanceRouter.get("/", async (req, res) => {
  const userId = "abcd";

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const userData = await redis.hGetAll(userId);
  if (!userData || !userData.balance) {
    return res.status(404).json({ message: "User data not found" });
  }

  const userBalance = JSON.parse(userData.balance);
  res.json(userBalance);
});
