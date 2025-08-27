import { WebSocketServer, WebSocket } from "ws";
import { UserManager } from "./userManager";
import { SubscriptionManager } from "./subscriptionManager";

export enum WS_MSG_TYPE {
  IDENTIFY = "identify",
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg.toString("utf-8"));
      if (data.type === WS_MSG_TYPE.IDENTIFY) {
        UserManager.getInstance().addUser(data.userId, ws);
      } else if (data.type === "SUBSCRIBE" || data.type === "UNSUBSCRIBE") {
        SubscriptionManager.getInstance().handleSubscription(data, ws);
      }
    } catch (err) {}
  });
});
