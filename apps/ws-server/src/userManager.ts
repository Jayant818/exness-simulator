import { SubscriptionManager } from "./subscriptionManager.js";
import { User } from "./user.js";
import { WebSocket as WsWebSocket } from "ws";

export class UserManager {
  private static instance: UserManager;
  // Map of userId to User
  private users: Map<string, User> = new Map();
  // reverse lookup of ws to userId
  private wsToUserId: Map<WsWebSocket, string> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(id: string, ws: WsWebSocket) {
    const user = new User(id, ws);
    this.users.set(id, user);
    this.wsToUserId.set(ws, id);
  }

  public getUserFromWs(ws: WsWebSocket) {
    return this.wsToUserId.get(ws);
  }

  public getUserFromId(id: string) {
    return this.users.get(id);
  }

  public userLeft(ws: WsWebSocket) {
    // get the userId
    const userId = this.wsToUserId.get(ws);
    if (userId) {
      this.users.delete(userId);
      this.wsToUserId.delete(ws);
      // Also need to remove the users from all the subscriptions
      SubscriptionManager.getInstance().userLeft(userId);
    }
  }
}
