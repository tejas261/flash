import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

import { env } from "@/lib/env";

declare global {
  var prisma: PrismaClient | undefined;
}

function getPrismaClient() {
  if (!globalThis.prisma) {
    const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

    globalThis.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  }

  return globalThis.prisma;
}

export const db = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    return getPrismaClient()[prop as keyof PrismaClient];
  },
});
