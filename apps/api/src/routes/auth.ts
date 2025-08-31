import { Router } from "express";
import * as crypto from "crypto";
import { redis } from "@repo/shared-redis";
import jwt from "jsonwebtoken";
import PrismaClient from "@repo/primary-db";
import bcrypt from "bcrypt";

export const authRouter = Router();

interface IGetUserBalanceResponse {
  usd_balance: string;
}

authRouter.get("/me", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

  if (!JSON_WEB_TOKEN_SECRET) {
    return res.status(500).json({ error: "Missing JSON_WEB_TOKEN_SECRET" });
  }

  let decoded: { userId: string; username: string };

  try {
    decoded = jwt.verify(token, JSON_WEB_TOKEN_SECRET) as {
      userId: string;
      username: string;
    };
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const user = await PrismaClient.prisma.user.findUnique({
    where: {
      id: decoded.userId,
    },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const userData = await redis.hGetAll(user.id);

  const userBalance = userData.balance
    ? JSON.parse(userData.balance)
    : { usd: "0", locked_usd: "0" };

  res.status(200).json({
    userId: user.id,
    username: user.username,
    email: user.email,
    balance: userBalance,
  });
});

authRouter.post("/signin", async (req, res) => {
  // Check if user exists or not
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  const user = await PrismaClient.prisma.user.findUnique({
    where: {
      username: username,
    },
  });

  if (!user) {
    return res.status(403).json({ error: "" });
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    return res.status(403).json({ error: "Error while signing up" });
  }

  const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

  if (!JSON_WEB_TOKEN_SECRET) {
    return res.status(500).json({ error: "Error while signing up" });
  }

  // Create a JSON web token and send it back to cookies
  const token = jwt.sign({ username, userId: user.id }, JSON_WEB_TOKEN_SECRET);

  // res.cookie("token", token);
  res.status(200).json({ userId: user.id, token: token });
});

authRouter.post("/signup", async (req, res) => {
  const { username, password, email } = req.body;

  if (!username || !password || !email) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await PrismaClient.prisma.user.create({
    data: {
      email,
      username,
      password: passwordHash,
    },
  });
  redis.hSet(user.id, {
    username: user.username,
    email: user.email,
    balance: JSON.stringify({
      usd: "500000",
      locked_usd: "0",
    }),
    locked_balance: "0",
  });

  const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

  if (!JSON_WEB_TOKEN_SECRET) {
    return res.status(500).json({ error: "Missing JSON_WEB_TOKEN_SECRET" });
  }
  // create a json web token and send it back to cookies
  const token = jwt.sign(
    { username: user.username, userId: user.id },
    JSON_WEB_TOKEN_SECRET
  );

  // res.cookie("token", token);
  res.status(201).json({ userId: user.id, token: token });
});

authRouter.get("/balance", (req, res) => {});
