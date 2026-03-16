import { OrderStatus } from "@prisma/client";
import { cache } from "react";

import { db } from "@/lib/db";

export const getRestaurantBySlug = cache(async (slug: string) => {
  return db.restaurant.findUnique({
    where: { slug },
  });
});

export const getPublicRestaurantMenu = cache(async (slug: string) => {
  return db.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      heroTitle: true,
      heroDescription: true,
      currency: true,
      themeColor: true,
      supportPhone: true,
      categories: {
        where: { isActive: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          sortOrder: true,
          items: {
            where: { isAvailable: true },
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            select: {
              id: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
              spiceLevel: true,
              isFeatured: true,
            },
          },
        },
      },
    },
  });
});

export async function getAdminMenuData(restaurantId: string) {
  return db.restaurant.findUnique({
    where: { id: restaurantId },
    select: {
      id: true,
      name: true,
      slug: true,
      categories: {
        orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
        select: {
          id: true,
          name: true,
          sortOrder: true,
          isActive: true,
          items: {
            orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
            select: {
              id: true,
              categoryId: true,
              name: true,
              description: true,
              imageUrl: true,
              price: true,
              isAvailable: true,
              isFeatured: true,
              spiceLevel: true,
              sortOrder: true,
            },
          },
        },
      },
    },
  });
}

export async function getAdminOrdersData(restaurantId: string) {
  return db.order.findMany({
    where: { restaurantId },
    orderBy: [{ placedAt: "desc" }],
    take: 50,
    include: {
      items: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
}

export const getOrderTrackingData = cache(async (orderId: string) => {
  return db.order.findUnique({
    where: { id: orderId },
    include: {
      restaurant: true,
      items: {
        orderBy: { createdAt: "asc" },
      },
      events: {
        orderBy: { createdAt: "asc" },
      },
    },
  });
});

export async function getReadyOrdersBySlug(slug: string) {
  return db.restaurant.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      orders: {
        where: {
          status: {
            in: [OrderStatus.READY, OrderStatus.COMPLETED],
          },
        },
        orderBy: [{ statusUpdatedAt: "desc" }],
        take: 24,
        select: {
          id: true,
          tokenNumber: true,
          status: true,
          customerName: true,
          statusUpdatedAt: true,
        },
      },
    },
  });
}
