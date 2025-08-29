import { WebSocketServer, WebSocket } from "ws";
import { UserManager } from "./userManager.js";
import { SubscriptionManager } from "./subscriptionManager.js";

export enum WS_MSG_TYPE {
  IDENTIFY = "IDENTIFY",
  SUBSCRIBE = "SUBSCRIBE",
  UNSUBSCRIBE = "UNSUBSCRIBE",
}

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", function connection(ws) {
  ws.on("message", (msg) => {
    try {
      console.log("Received message:", msg.toString("utf-8"));
      const data = JSON.parse(msg.toString("utf-8"));
      if (data.type === WS_MSG_TYPE.IDENTIFY) {
        UserManager.getInstance().addUser(data.userId, ws);
      } else if (
        data.type === WS_MSG_TYPE.SUBSCRIBE ||
        data.type === WS_MSG_TYPE.UNSUBSCRIBE
      ) {
        SubscriptionManager.getInstance().handleSubscription(data, ws);
      }
    } catch (err) {}
  });

  ws.on("close", () => {
    console.log("WebSocket disconnected");
    UserManager.getInstance().userLeft(ws);
  });

  ws.on("error", (err) => {
    // delegate this task to userManager?
    console.log("WebSocket error:", err);
    UserManager.getInstance().userLeft(ws);
  });
});
