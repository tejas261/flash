import type { OrderStatus } from "@/generated/prisma/enums";

import { getRedisClient } from "@/lib/redis";

export type OrderEventPayload = {
  kind: "order.created" | "order.updated";
  restaurantId: string;
  orderId: string;
  tokenNumber: number;
  status: OrderStatus;
  customerName: string;
  updatedAt: string;
};

function channelForRestaurant(restaurantId: string) {
  return `restaurant:${restaurantId}:orders`;
}

function channelForOrder(orderId: string) {
  return `order:${orderId}`;
}

export async function publishOrderEvent(payload: OrderEventPayload) {
  const body = JSON.stringify(payload);
  const redis = getRedisClient();

  await Promise.all([
    redis.publish(channelForRestaurant(payload.restaurantId), body),
    redis.publish(channelForOrder(payload.orderId), body),
  ]);
}

export function getRestaurantOrdersChannel(restaurantId: string) {
  return channelForRestaurant(restaurantId);
}

export function getOrderChannel(orderId: string) {
  return channelForOrder(orderId);
}
