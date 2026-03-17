import type { Prisma } from "@/generated/prisma/client";
import { format } from "date-fns";

export async function generateSequentialToken(tx: Prisma.TransactionClient, restaurantId: string) {
  const dateKey = format(new Date(), "yyyyMMdd");

  const counter = await tx.dailyTokenCounter.upsert({
    where: {
      restaurantId_dateKey: {
        restaurantId,
        dateKey,
      },
    },
    create: {
      restaurantId,
      dateKey,
      currentValue: 1,
    },
    update: {
      currentValue: {
        increment: 1,
      },
    },
  });

  return counter.currentValue;
}
