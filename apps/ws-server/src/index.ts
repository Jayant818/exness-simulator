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
    console.log("Received message:", msg.toString("utf-8"));
    try {
      console.log("Received message:", msg.toString("utf-8"));
      const message = JSON.parse(msg.toString("utf-8"));
      if (message.type === WS_MSG_TYPE.IDENTIFY) {
        UserManager.getInstance().addUser(message.userId, ws);
      } else if (
        message.type === WS_MSG_TYPE.SUBSCRIBE ||
        message.type === WS_MSG_TYPE.UNSUBSCRIBE
      ) {
        SubscriptionManager.getInstance().handleSubscription(message, ws);
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
