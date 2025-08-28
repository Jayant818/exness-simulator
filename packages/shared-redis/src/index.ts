import { createClient, RedisClientType as RedisType } from "redis";

export class RedisManager {
  private static standardClient: RedisType;
  private static subscriberClient: RedisType;

  private constructor() {}

  private static async createClient(): Promise<RedisType> {
    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

    const client = createClient({ url: redisUrl });
    await client.connect();
    // @ts-ignore
    return client;
  }

  public static async getStandardClient(): Promise<RedisType> {
    if (!RedisManager.standardClient) {
      RedisManager.standardClient = await this.createClient();
    }

    return RedisManager.standardClient;
  }

  public static async getSubscriberClient(): Promise<RedisType> {
    if (!RedisManager.subscriberClient) {
      RedisManager.subscriberClient = await this.createClient();
    }

    return RedisManager.subscriberClient;
  }
}

export const redis = await RedisManager.getStandardClient();
export const publisher = redis;
export const subscriber = await RedisManager.getSubscriberClient();
