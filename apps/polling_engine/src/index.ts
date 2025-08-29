// It should susbcribe to some things on binance
// It only subscribe when a request comes from a pubsub
// It unsubscribe when it gets a request from pubsub
import {
  POLLING_ENGINE_EVENT_CHANNEL,
  BINANCE_WS_URL,
  POLLING_ENGINE_QUEUE_NAME,
  MARKET_TRADE_CHANNELS,
} from "@repo/common";

import { publisher, subscriber } from "@repo/shared-redis";

interface msgType {
  type: "SUBSCRIBE" | "UNSUBSCRIBE";
  market: string;
}

let SUBSCRIBED_MARKETS: Map<string, WebSocket> = new Map();

async function main() {
  const publisherClient = publisher;

  const subscribeClient = subscriber;

  subscribeClient.subscribe(POLLING_ENGINE_EVENT_CHANNEL, (msg) => {
    const data: msgType = JSON.parse(msg);

    if (data.type === "SUBSCRIBE") {
      handleSubscribeMarket(data.market);
    } else if (data.type === "UNSUBSCRIBE") {
      handleUnsubscribeMarket(data.market);
    }
  });

  async function handleSubscribeMarket(market: string) {
    console.log("subscribing to the market");
    if (SUBSCRIBED_MARKETS.has(market)) {
      return;
    }

    // Open the connection
    const webSocket = new WebSocket(
      `${BINANCE_WS_URL}${market.toLowerCase()}@trade`
    );

    webSocket.onopen = () => {
      console.log(`WebSocket connection established for market: ${market}`);
      SUBSCRIBED_MARKETS.set(market, webSocket);
    };

    webSocket.onmessage = async (msg) => {
      const data = JSON.parse(msg.data);
      console.log("Pushing data to Redis:", data.data);
      await publisher.lPush(
        POLLING_ENGINE_QUEUE_NAME,
        JSON.stringify(data.data)
      );

      const tickerData = {
        buy: parseFloat(data.data.p) * (1 + 0.01 * 5), //+5% margin
        sell: parseFloat(data.data.p) * (1 - 0.01 * 5), //-5% margin
        market: market,
        time: data.data.E,
      };

      await publisherClient.publish("btcusdt", JSON.stringify(tickerData));
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
}

main();
