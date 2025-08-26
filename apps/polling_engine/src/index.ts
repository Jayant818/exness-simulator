// It should susbcribe to some things on binance
// It only subscribe when a request comes from a pubsub
// It unsubscribe when it gets a request from pubsub
import {
  POLLING_ENGINE_EVENT_CHANNEL,
  BINANCE_WS_URL,
  POLLING_ENGINE_QUEUE_NAME,
} from "@repo/common";

import { createClient } from "redis";
import { RedisManager } from "@repo/shared-redis";

interface msgType {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  market: string;
}

let SUBSCRIBED_MARKETS: Map<string, WebSocket> = new Map();

async function main() {
  const subscribeClient = await createClient().connect();

  subscribeClient.subscribe(POLLING_ENGINE_EVENT_CHANNEL, (msg) => {
    const data: msgType = JSON.parse(msg);

    if (data.type === "SUBSCRIBE") {
      handleSubscribeMarket(data.market);
    } else if (data.type === "UNSUBSCRIBE") {
      handleUnsubscribeMarket(data.market);
    }
  });
}

async function handleSubscribeMarket(market: string) {
  console.log("subscribing to the market");
  if (SUBSCRIBED_MARKETS.has(market)) {
    return;
  }

  let redisInstance = RedisManager.getInstance();

  // Open the connection
  const webSocket = new WebSocket(`${BINANCE_WS_URL}/${market}`);

  webSocket.onopen = () => {
    console.log(`WebSocket connection established for market: ${market}`);
    SUBSCRIBED_MARKETS.set(market, webSocket);
  };

  webSocket.onmessage = async (msg) => {
    const data = JSON.parse(msg.data);
    await redisInstance.pushMessage(
      POLLING_ENGINE_QUEUE_NAME,
      JSON.stringify(data)
    );
  };

  webSocket.onclose = () => {
    SUBSCRIBED_MARKETS.delete(market);
  };

  webSocket.onerror = (err) => {
    console.log("Get Error on websocket connection", err);
  };
}

async function handleUnsubscribeMarket(market: string) {
  if (SUBSCRIBED_MARKETS.has(market)) {
    const ws = SUBSCRIBED_MARKETS.get(market);
    ws?.close();
    SUBSCRIBED_MARKETS.delete(market);
  }
}

main();
