import { POLLING_ENGINE_EVENT_CHANNEL } from "@repo/common";
import { publisher } from "@repo/shared-redis";

const markets = ["BTCUSDT", "ETHUSDT", "XRPUSDT", "LTCUSDT", "SOLUSDT"];
export async function publishDataToPubsub() {
  for (const market of markets) {
    const data = {
      type: "SUBSCRIBE",
      market: market,
      // Include any other relevant data here
    };
    await publisher.publish(POLLING_ENGINE_EVENT_CHANNEL, JSON.stringify(data));
  }
}
