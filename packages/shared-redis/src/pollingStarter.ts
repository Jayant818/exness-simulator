import { POLLING_ENGINE_EVENT_CHANNEL } from "@repo/common";
import { publisher } from "./index.js";

// The markets you want to ensure are always polled
const markets = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT"];

export async function restartPolling() {
  console.log("Sending command to restart polling for all markets...");
  for (const market of markets) {
    const data = {
      type: "SUBSCRIBE",
      market: market,
    };
    await publisher.publish(POLLING_ENGINE_EVENT_CHANNEL, JSON.stringify(data));
  }
  console.log("Polling restart command sent.");
}
