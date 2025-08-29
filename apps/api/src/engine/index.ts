import { IOpenOrderRes } from "../routes/trade.js";

export class Engine {
  private static OPEN_ORDERS: IOpenOrderRes[] = [];

  private constructor() {}

  public static async checkAndLockBalance({ userId, QTY, balance }: {
    userId: string;
    QTY: number;
    balance: string;
  }) {
    //   Lock the amount and check if the user has enough balance
  }

  public static async process(data: {
    type: string;
    QTY: number;
    TP?: number;
    SL?: number;
    trade_type: string;
    market: string;
    balance: string;
    userId: string;
  }) {
    //   Lock the amount and check if the user has enough balance
      await this.checkAndLockBalance({ userId: data.userId, QTY: data.QTY, balance: data.balance });
  }
}
