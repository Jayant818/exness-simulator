import { redis } from "@repo/shared-redis";
import { IOpenOrderRes, TradeType } from "../routes/trade.js";

export class Engine {
  private static OPEN_ORDERS: IOpenOrderRes[] = [];
  private static PENDING_ORDERS: IOpenOrderRes[] = [];

  private constructor() {}

  public static async LockBalance({
    userId,
    amountToLock,
  }: {
    amountToLock: number;
    userId: string;
  }) {
    // Lock the amount and check if the user has enough balance
    const userData = await redis.hGetAll(userId);
    const userBalance = userData.balance
      ? JSON.parse(userData.balance)
      : { usd: 0, locked_usd: 0 };

    if (userBalance.usd < amountToLock) {
      throw new Error("Insufficient balance");
    }

    // Lock the amount
    userBalance.usd -= amountToLock;
    userBalance.locked_usd += amountToLock;

    await redis.hSet(userId, {
      ...userData,
      balance: JSON.stringify(userBalance),
    });
  }

  // TODO : We will get margin from our end it will calculated on the server itself
  public static async process(data: {
    type: "market" | "limit";
    side: "buy" | "sell";
    QTY: number;
    TP?: number;
    SL?: number;
    market: string;
    balance: string;
    userId: string;
    leverage?: "5x" | "10x" | "20x" | "100x" | "";
  }) {
    const tradeData = await redis.hGetAll(`trade:${data.userId}`);

    const userData = await redis.hGetAll(data.userId);

    if (!userData.balance) {
      throw new Error("Data not found for the user in Memory");
    }

    const userBalance = JSON.parse(userData.balance);

    let leverageUsed = data.leverage ? Number(data.leverage.slice(0, -1)) : 0;

    const amountToLock = !data.leverage
      ? data.QTY * Number(tradeData.buy) * 100
      : (data.QTY * Number(tradeData.buy)) / leverageUsed;
    //   Lock the amount and check if the user has enough balance
    await this.LockBalance({
      userId: data.userId,
      amountToLock,
    });

    const orderId = crypto.randomUUID();

    if (data.side === "buy") {
      if (data.type === "market" && !data.leverage) {
        this.OPEN_ORDERS.push({
          orderId,
          type: data.type,
          side: data.side,
          QTY: data.QTY,
          TP: data.TP,
          SL: data.SL,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: Number(tradeData.buy),
        });

        // Update users balance and add assests for the user

        const userData = await redis.hGetAll(data.userId);

        if (!userData.balance) {
          throw new Error("Data not found for the user in Memory");
        }

        const userBalance = JSON.parse(userData.balance);

        const NewuserBalance = {
          usd: userBalance ? userBalance.usd : 0,
          locked_usd: userBalance
            ? userBalance.locked_usd - data.QTY * Number(tradeData.buy) * 100
            : 0,
          [data.market]: data.QTY,
        };

        await redis.hSet(data.userId, {
          ...userData,
          balance: JSON.stringify(NewuserBalance),
        });

        return orderId;
      } else if (data.type === "limit" && !data.leverage) {
        this.PENDING_ORDERS.push({
          orderId,
          type: data.type,
          side: data.side,
          QTY: data.QTY,
          TP: data.TP,
          SL: data.SL,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: Number(tradeData.buy),
        });

        // Update users balance and add assests for the user

        const userData = await redis.hGetAll(data.userId);

        if (!userData.balance) {
          throw new Error("Data not found for the user in Memory");
        }

        const userBalance = JSON.parse(userData.balance);

        const NewuserBalance = {
          usd: userBalance ? userBalance.usd : 0,
          locked_usd: userBalance
            ? userBalance.locked_usd - data.QTY * Number(tradeData.buy) * 100
            : 0,
          // [data.market]: data.QTY, // assest is not added until the order is executed
        };

        await redis.hSet(data.userId, {
          ...userData,
          balance: JSON.stringify(NewuserBalance),
        });

        return orderId;
      } else if (data.type === "market" && data.leverage) {
        // yaha pe user can provide with any of the 2 fields so we have first get all 3 fields
        let totalQty = data.QTY ? Number(data.QTY) : 0;
        // let margin = data.margin ? Number(data.margin) : 0;
        let leverageUsed = data.leverage
          ? Number(data.leverage.slice(0, -1))
          : 0;
        let borrowedAmount;
        if (!leverageUsed || !totalQty || leverageUsed > 40) {
          throw new Error("Incorrect Input");
        }

        const userData = await redis.hGetAll(data.userId);

        if (!userData.balance) {
          throw new Error("Data not found for the user in Memory");
        }

        const userBalance = JSON.parse(userData.balance);

        borrowedAmount = totalQty * Number(tradeData.buy);
        let margin = borrowedAmount / leverageUsed;

        // if (margin && leverageUsed) {
        //   borrowedAmount = Number(margin) * leverageUsed;
        //   totalQty = borrowedAmount / Number(tradeData.buy);
        // } else if (margin && totalQty) {
        //   borrowedAmount = totalQty * Number(tradeData.buy);

        //   // TODO : CHECK IF THAT AMOUNT OF LEVERAGE WE SUPPORT OR NOT
        //   leverageUsed = borrowedAmount / margin;

        //   if (leverageUsed > 40) {
        //     throw new Error("That Much amount of leverage is not supported");
        //   }
        // } else if (totalQty && leverageUsed) {
        //   let borrowedAmount = totalQty * Number(tradeData.buy);
        //   let margin = borrowedAmount / leverageUsed;
        // }

        if (!totalQty || !margin || !leverageUsed || !borrowedAmount) {
          throw new Error("Fields are missing for this operation");
        }

        // Checking margin provided is correct or not
        if (margin > userBalance.usd) {
          throw new Error("User don't have sufficient balance to do the trade");
        }

        this.OPEN_ORDERS.push({
          market: data.market,
          openPrice: Number(tradeData.buy) * 100,
          orderId,
          QTY: totalQty,
          leverage: leverageUsed,
          side: "buy",
          type: "market",
          margin,
          SL: data.SL,
          TP: data.TP,
          createdAt: new Date().toISOString(),
        });

        const positions = userData.positions
          ? JSON.parse(userData.positions)
          : {};

        positions[data.market] = {
          side: "long",
          qty: totalQty,
          leverage: leverageUsed,
          entryPrice: Number(tradeData.buy),
          margin,
        };

        await redis.hSet(data.userId, {
          ...userData,
          positions: JSON.stringify(positions),
        });

        return orderId;
      } else if (data.type === "limit" && data.leverage) {
        let totalQty = data.QTY ? Number(data.QTY) : 0;
        // let margin = data.margin ? Number(data.margin) : 0;
        let leverageUsed = data.leverage
          ? Number(data.leverage.slice(0, -1))
          : 0;
        let borrowedAmount;
        if (!leverageUsed || !totalQty || leverageUsed > 40) {
          throw new Error("Incorrect Input");
        }

        const userData = await redis.hGetAll(data.userId);

        if (!userData.balance) {
          throw new Error("Data not found for the user in Memory");
        }

        const userBalance = JSON.parse(userData.balance);

        borrowedAmount = totalQty * Number(tradeData.buy);
        let margin = borrowedAmount / leverageUsed;

        if (!totalQty || !margin || !leverageUsed || !borrowedAmount) {
          throw new Error("Fields are missing for this operation");
        }

        // Checking margin provided is correct or not
        if (margin > userBalance.usd) {
          throw new Error("User don't have sufficient balance to do the trade");
        }

        this.PENDING_ORDERS.push({
          orderId,
          type: data.type,
          side: data.side,
          QTY: data.QTY,
          TP: data.TP,
          SL: data.SL,
          market: data.market,
          createdAt: new Date().toISOString(),
          openPrice: Number(tradeData.buy),
        });

        const positions = userData.positions
          ? JSON.parse(userData.positions)
          : {};

        positions[data.market] = {
          side: "long",
          qty: totalQty,
          leverage: leverageUsed,
          entryPrice: Number(tradeData.buy),
          margin,
        };

        await redis.hSet(data.userId, {
          ...userData,
          positions: JSON.stringify(positions),
        });

        return orderId;
      }
    }
  }
}
