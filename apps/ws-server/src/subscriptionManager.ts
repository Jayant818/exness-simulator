import { WebSocket as WsWebSocket } from "ws";
import { User } from "./user";
import { MARKET_TRADE_CHANNELS, SUPPORTED_MARKETS } from "./constants";
import { createClient } from "redis";

interface SubscriptionData {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  market: string;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, WsWebSocket[]> = new Map();
  private reverseSubscriptions: Map<WsWebSocket, string[]> = new Map();

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public handleSubscription(data: SubscriptionData, ws: WsWebSocket) {

    const subscriberClient = await createClient().connect()

    if (data.type === "SUBSCRIBE") {
      // check if the market is already subscribed by the server
      if (!this.subscriptions.has(data.market) && data.market in SUPPORTED_MARKETS) {

        this.subscriptions.set(data.market, [ws]);
        // Subscribe to the market
        subscriberClient.subscribe(MARKET_TRADE_CHANNELS, (message) => {
          // Get all subscribed users for this market
          const users = this.subscriptions.get(data.market);
          users?.forEach((user) => {
            user.send(message);
          })
        })
      } else {
        // Market is already subscribed, just add the user to the list
        const users = this.subscriptions.get(data.market);
        if (users && !users.includes(ws)) {
          users.push(ws);
          this.subscriptions.set(data.market, users);
        }
      }

    } else if (data.type === "UNSUBSCRIBE") {
      // unsub that user

      // Check if there are user  subscribed to this market
    }
}
