import { User } from "./user";
import { WebSocket as WsWebSocket } from "ws";

export class UserManager {
  private static instance: UserManager;
  private users: Map<string, WsWebSocket> = new Map();

  private constructor() {}

  public static getInstance() {
    if (!this.instance) {
      this.instance = new UserManager();
    }
    return this.instance;
  }

  public addUser(id: string, ws: WsWebSocket) {
    const user = new User(id, ws);
    this.users.set(id, ws);
  }
}
