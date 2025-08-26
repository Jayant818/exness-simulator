import { createClient, RedisClientType } from "redis";

export class RedisManager {
  private static instance: RedisManager;
  private client: RedisClientType;

  private constructor() {
    this.client = createClient();
    this.client.connect();
  }

  public static getInstance(): RedisManager {
    if (!this.instance) {
      this.instance = new RedisManager();
    }

    return this.instance;
  }

  public pushMessage(queue: string, message: string): Promise<number> {
    return this.client.lPush(queue, message);
  }
}
