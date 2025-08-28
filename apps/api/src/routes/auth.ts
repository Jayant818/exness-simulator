import { Router } from "express";

export const authRouter = Router();

authRouter.post("/login", (req, res) => {});

authRouter.post("/register", (req, res) => {
  const { username, password } = req.body;
  // Create a user in the DB
  // Check if user already exists
  // Store the user in redis
});
