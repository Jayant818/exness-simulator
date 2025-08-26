import { Router } from "express";

export const orderRouter = Router();

orderRouter.post("/", (req, res) => {
  const { type, qty, asset, stopLoss, takeProfit } = req.body;
});

orderRouter.get("/", (req, res) => {
  // get all the orderes
});

orderRouter.delete("/close", (req, res) => {
  const { orderId } = req.body;
});
