import Redis from "ioredis";

import { env } from "@/lib/env";

declare global {
  var redis: Redis | undefined;
}

export function getRedisClient() {
  if (!globalThis.redis) {
    globalThis.redis = new Redis(env.REDIS_URL, {
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  }

  return globalThis.redis;
}

export function createRedisSubscriber() {
  return new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
  });
}
