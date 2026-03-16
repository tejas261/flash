import { CheckoutStatus, OrderStatus } from "@prisma/client";

import { calculateOrderPricing } from "@/lib/money";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { publishOrderEvent } from "@/lib/order-events";
import { getRazorpayClient } from "@/lib/razorpay";
import { generateSequentialToken } from "@/lib/tokens";

export type CheckoutItemSnapshot = {
  menuItemId: string;
  quantity: number;
  notes?: string;
  nameSnapshot: string;
  priceSnapshot: number;
  lineTotal: number;
};

type CreateCheckoutSessionInput = {
  restaurantSlug: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
  items: Array<{
    menuItemId: string;
    quantity: number;
    notes?: string;
  }>;
};

export async function createCheckoutSession(input: CreateCheckoutSessionInput) {
  const restaurant = await db.restaurant.findUnique({
    where: { slug: input.restaurantSlug },
    include: {
      menuItems: {
        where: {
          id: {
            in: input.items.map((item) => item.menuItemId),
          },
          isAvailable: true,
        },
      },
    },
  });

  if (!restaurant) {
    throw new Error("Restaurant not found.");
  }

  const itemMap = new Map(restaurant.menuItems.map((item) => [item.id, item]));
  const normalizedItems: CheckoutItemSnapshot[] = input.items.map((item) => {
    const menuItem = itemMap.get(item.menuItemId);

    if (!menuItem) {
      throw new Error("One or more menu items are unavailable.");
    }

    return {
      menuItemId: menuItem.id,
      quantity: item.quantity,
      notes: item.notes,
      nameSnapshot: menuItem.name,
      priceSnapshot: menuItem.price,
      lineTotal: menuItem.price * item.quantity,
    };
  });

  const subtotal = normalizedItems.reduce((sum, item) => sum + item.lineTotal, 0);
  const pricing = calculateOrderPricing(subtotal);

  const checkoutSession = await db.checkoutSession.create({
    data: {
      restaurantId: restaurant.id,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      notes: input.notes || null,
      itemsJson: normalizedItems,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      total: pricing.total,
    },
  });

  const razorpay = getRazorpayClient();
  const razorpayOrder = await razorpay.orders.create({
    amount: pricing.total,
    currency: restaurant.currency,
    receipt: `checkout_${checkoutSession.id}`,
    notes: {
      checkoutSessionId: checkoutSession.id,
      restaurantSlug: restaurant.slug,
    },
  });

  await db.checkoutSession.update({
    where: { id: checkoutSession.id },
    data: {
      razorpayOrderId: razorpayOrder.id,
    },
  });

  return {
    checkoutSessionId: checkoutSession.id,
    razorpayOrderId: razorpayOrder.id,
    amount: pricing.total,
    currency: restaurant.currency,
    keyId: env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
    restaurantName: restaurant.name,
  };
}

export async function finalizeVerifiedCheckout(checkoutSessionId: string, paymentReference: string) {
  const checkoutSession = await db.checkoutSession.findUnique({
    where: { id: checkoutSessionId },
    include: {
      restaurant: true,
      order: true,
    },
  });

  if (!checkoutSession) {
    throw new Error("Checkout session not found.");
  }

  if (checkoutSession.order) {
    return checkoutSession.order;
  }

  const items = checkoutSession.itemsJson as CheckoutItemSnapshot[];

  const order = await db.$transaction(async (tx) => {
    await tx.checkoutSession.update({
      where: { id: checkoutSession.id },
      data: {
        status: CheckoutStatus.VERIFIED,
      },
    });

    const tokenNumber = await generateSequentialToken(tx, checkoutSession.restaurantId);
    const createdOrder = await tx.order.create({
      data: {
        restaurantId: checkoutSession.restaurantId,
        checkoutSessionId: checkoutSession.id,
        tokenNumber,
        status: OrderStatus.NEW,
        customerName: checkoutSession.customerName,
        customerPhone: checkoutSession.customerPhone,
        notes: checkoutSession.notes,
        subtotal: checkoutSession.subtotal,
        tax: checkoutSession.tax,
        total: checkoutSession.total,
        paymentReference,
        items: {
          create: items.map((item) => ({
            menuItemId: item.menuItemId,
            nameSnapshot: item.nameSnapshot,
            priceSnapshot: item.priceSnapshot,
            quantity: item.quantity,
            notes: item.notes || null,
            lineTotal: item.lineTotal,
          })),
        },
        events: {
          create: {
            status: OrderStatus.NEW,
          },
        },
      },
    });

    return createdOrder;
  });

  await publishOrderEvent({
    kind: "order.created",
    restaurantId: checkoutSession.restaurantId,
    orderId: order.id,
    tokenNumber: order.tokenNumber,
    status: order.status,
    customerName: order.customerName,
    updatedAt: order.statusUpdatedAt.toISOString(),
  });

  return order;
}
