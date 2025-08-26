import { createClient, RedisClientType } from "redis";
import { MessageToSend } from "./types";

export class RedisManager {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    // There should be different instance for publishing and subscribing
    this.client = createClient();
    this.client.connect();
    this.publisher = createClient();
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }

    return this.instance;
  }

  public async sendAndWait(message: MessageToSend) {
    return new Promise((resolve) => {
      // subscribe to that messag and when that msg came resolve the promise
      // this.client.subscribe(message.type);
      // this.publisher.publish();
    });
  }
}
