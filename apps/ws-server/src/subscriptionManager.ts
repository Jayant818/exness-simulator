import { WebSocket as WsWebSocket } from "ws";
import { MARKET_TRADE_CHANNELS, SUPPORTED_MARKETS } from "./constants.js";
import { createClient, RedisClientType } from "redis";
import { UserManager } from "./userManager.js";
import { subscriber } from "@repo/shared-redis";

interface SubscriptionData {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  market: string;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  // From user to Markets
  private subscriptions: Map<string, string[]> = new Map();
  // Markets to users
  private reverseSubscriptions: Map<string, string[]> = new Map();

  private constructor() {}

  public static getInstance(): SubscriptionManager {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public handleSubscription(data: SubscriptionData, ws: WsWebSocket) {
    let user = UserManager.getInstance().getUserFromWs(ws);

    if (!user) {
      ws.send(JSON.stringify({ error: "Please identify first." })); // <-- Add this
      console.log("Subscription attempt by unidentified user.");
      return;
    }

    console.log("data", data);
    console.log("set", this.reverseSubscriptions.has(data.market));
    console.log("supported", data.market in SUPPORTED_MARKETS);
    console.log("market", SUPPORTED_MARKETS);
    console.log("user", user);

    if (data.type === "SUBSCRIBE") {
      // check if the market is already subscribed by the server
      if (
        !this.reverseSubscriptions.has(data.market)
        // data.market in SUPPORTED_MARKETS
      ) {
        this.subscriptions.set(user, [data.market]);
        this.reverseSubscriptions.set(data.market, [user]);
        console.log("Subscribing to market:", data.market);
        // Subscribe to the market
        subscriber.subscribe(data.market, (message) => {
          console.log("Received message for market:", data.market);
          // Get all subscribed users for this market
          const users = this.reverseSubscriptions.get(data.market);
          console.log("Subscribed users:", users);
          users?.forEach((user) => {
            // we have to userId here, get the user
            UserManager.getInstance()
              .getUserFromId(user)
              ?.emit({
                type: "TRADE",
                data: JSON.parse(message),
                market: data.market,
              });
          });
        });
      } else {
        // Market is already subscribed add the user to the list
        this.subscriptions.set(user, [
          ...(this.subscriptions.get(user) || []),
          data.market,
        ]);
        this.reverseSubscriptions.set(data.market, [
          ...(this.reverseSubscriptions.get(data.market) || []),
          user,
        ]);
      }
    } else if (data.type === "UNSUBSCRIBE") {
      // Remove the user from the market if no users are left, unsubscribe from redis
      const markets = this.subscriptions.get(user);
      this.subscriptions.delete(user);

      if (markets) {
        markets.forEach((market) => {
          let users = this.reverseSubscriptions.get(market);
          if (users) {
            users = users.filter((u) => u != user);

            this.reverseSubscriptions.set(market, users);

            if (!users) {
              // remove the subscription from the reverse Subscription
              this.reverseSubscriptions.delete(market);
              // Handle Unsuscribe
              subscriber.unsubscribe(market);
            }
          } else {
            // No user
            // unsubscribe from the market
            subscriber.unsubscribe(market);
          }
        });
      }
    }
  }

  public userLeft(userId: string) {
    // User Left, remove all subs and unscribe from redis if no users are left

    const markets = this.subscriptions.get(userId);
    this.subscriptions.delete(userId);
    if (markets) {
      // loop over each market and remove the user from reverseSubscription
      // after that check if there are any users left for that market
      // if no users are left, remove the market from subscriptions and
      // unsubscribe from redis

      markets.forEach((market) => {
        let users = this.reverseSubscriptions.get(market);
        if (users) {
          users = users.filter((user) => user != userId);

          this.reverseSubscriptions.set(market, users);

          if (!users) {
            // remove the subscription from the reverse Subscription
            this.reverseSubscriptions.delete(market);
            // Handle Unsuscribe
            subscriber.unsubscribe(market);
          }
        } else {
          // No user
          // unsubscribe from the market
          subscriber.unsubscribe(market);
        }
      });
    }
  }
}
