import { redis } from "@repo/shared-redis";
import { Router } from "express";
import { TRADE_KEY } from "@repo/common";
import { Engine } from "../engine/index.js";

interface ICreateTradeRequest {
  type: "market" | "limit";
  side: "buy" | "sell";
  leverage?: "5x" | "10x" | "20x" | "100x";
  QTY?: number;
  TP?: number;
  SL?: number;
  market: string;
}

export type TradeType = "without leverage" | "with leverage";

export interface IOpenOrderRes {
  orderId: string;
  type: "market" | "limit";
  side: "buy" | "sell";
  margin?: number;
  QTY: number;
  leverage?: number;
  openPrice: number;
  createdAt: string;
  TP?: number;
  SL?: number;
  market: string;
}

interface IClosedOrderRes extends IOpenOrderRes {
  closePrice: number;
  pnl: number;
}

interface IGetOpenOrdersResponse {
  orders: IOpenOrderRes[];
}

interface IGetClosedOrdersResponse {
  orders: IClosedOrderRes[];
}

export const OPEN_ORDERS: IOpenOrderRes[] = [];

export const tradeRouter = Router();

// create Trade

tradeRouter.post("/", async (req, res) => {
  // get User Id from the token & verify it using JWT token

  // const userId = req.cookies.userId;
  const userId = "abcd";

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { type, leverage, QTY, TP, SL, market } =
    req.body as ICreateTradeRequest;

  if (!type || !market || !QTY) {
    return res.status(411).json({ message: "Incorrect inputs" });
  }

  const user = await redis.hGetAll(userId);

  if (!user || !user.balance) {
    return res
      .status(401)
      .json({ message: "User doesn't have enough balance" });
  }

  // TODO : check if the order has moved to the takeprofit or stoploss already then close the order immediately

  const data = {
    type,
    side: req.body.side, // add side from request
    QTY,
    TP,
    SL,
    trade_type,
    market,
    balance: user.balance,
    userId: userId,
    leverage,
  };

  await Engine.process(data);

  res.status(200).json({ orderId: "Trade created successfully" });
});

// Get open orders

tradeRouter.get("/open", async (req, res) => {
  res.status(200).json({ orders: OPEN_ORDERS } as IGetOpenOrdersResponse);
});

// Get Existing Closed Orders
tradeRouter.get("/", async (req, res) => {
  res.status(200).json({ orders: [] } as IGetClosedOrdersResponse);
});
