import { Router } from "express";
import * as crypto from "crypto";
import { redis } from "@repo/shared-redis";
import jwt from "jsonwebtoken";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  // Check if user exists or not
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  // Gives us all the fields of the user
  const user = await redis.hGetAll(username);

  if (!user || !user.password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  // Check if password is correct
  if (user.password !== password) {
    return res.status(401).json({ error: "Invalid username or password" });
  }

  const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

  if (!JSON_WEB_TOKEN_SECRET) {
    return res.status(500).json({ error: "Missing JSON_WEB_TOKEN_SECRET" });
  }

  // Create a JSON web token and send it back to cookies
  const token = jwt.sign({ username }, JSON_WEB_TOKEN_SECRET);

  res.cookie("token", token);
  res.status(200).json({ message: "Login successful" });
});

authRouter.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: "Missing username or password" });
  }

  // const userId = crypto.randomUUID();

  redis.hSet(username, {
    password, // unencrypted password for now
  });

  const JSON_WEB_TOKEN_SECRET = process.env.JSON_WEB_TOKEN_SECRET;

  if (!JSON_WEB_TOKEN_SECRET) {
    return res.status(500).json({ error: "Missing JSON_WEB_TOKEN_SECRET" });
  }
  // create a json web token and send it back to cookies
  const token = jwt.sign({ username }, JSON_WEB_TOKEN_SECRET);

  res.cookie("token", token);
  res.status(201).json({ message: "User registered successfully" });
});
