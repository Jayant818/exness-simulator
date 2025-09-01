import { redis } from "@repo/shared-redis";
import { NextFunction, Router, Request, Response } from "express";
import { TRADE_KEY } from "@repo/common";
import { Engine } from "../engine/index.js";
import jwt from "jsonwebtoken";

interface ICreateTradeRequest {
  type: "market" | "limit";
  side: "buy" | "sell";
  leverage: number;
  QTY?: number;
  TP?: number;
  SL?: number;
  market: string;
}

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

export interface IClosedOrderRes extends IOpenOrderRes {
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

export interface AuthRequest extends Request {
  userId?: string;
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Invalid token format" });
    }

    const secret = process.env.JSON_WEB_TOKEN_SECRET!;
    const decoded = jwt.verify(token, secret) as { userId: string };

    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    return res.status(401).json({ message: "Unauthorized", error: error });
  }
};

// create Trade

tradeRouter.post("/", authMiddleware, async (req: AuthRequest, res) => {
  // get User Id from the token & verify it using JWT token

  const userId = req.userId;

  if (!userId) {
    return res
      .status(401)
      .json({ message: "Unauthorized", error: "User ID not found in token" });
  }

  const tradeData = await redis.hGetAll(
    `trade:${req.body.market.toLowerCase()}`
  );

  const { type, leverage, QTY, TP, SL, market, side } =
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
    side,
    QTY,
    TP,
    SL,
    market,
    balance: user.balance,
    userId: userId,
    leverage,
  };

  const orderId = await Engine.process(data);

  res.status(200).json({ orderId });
});

// Get open orders

tradeRouter.get("/open", authMiddleware, async (req: AuthRequest, res) => {
  // Get userId from the request
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const orderIds = Engine.userOrderMap.get(userId);
  if (orderIds) {
    const orders = Array.from(orderIds).map((id) => Engine.OPEN_ORDERS.get(id));
    return res.status(200).json({ orders } as IGetOpenOrdersResponse);
  }

  res.status(200).json({ orders: [] } as IGetOpenOrdersResponse);
});

// Get Existing Closed Orders
tradeRouter.get("/closed", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const ordersIds = await Engine.userOrderMap.get(userId);

  if (ordersIds) {
    const orders = Array.from(ordersIds).map((id) => {
      return Engine.CLOSED_ORDERS.get(id);
    });
  }

  res.status(200).json({ orders: [] } as IGetClosedOrdersResponse);
});
