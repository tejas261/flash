"use server";

import { OrderStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireAdminSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { publishOrderEvent } from "@/lib/order-events";
import { updateOrderStatusSchema } from "@/lib/validations";

function getStatusTimestamps(status: OrderStatus) {
  const now = new Date();

  return {
    statusUpdatedAt: now,
    readyAt: status === "READY" ? now : undefined,
    completedAt: status === "COMPLETED" ? now : undefined,
  };
}

export async function updateOrderStatusAction(formData: FormData) {
  const session = await requireAdminSession();
  const parsed = updateOrderStatusSchema.safeParse({
    orderId: formData.get("orderId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Unable to update order status.");
  }

  const order = await db.order.findFirst({
    where: {
      id: parsed.data.orderId,
      restaurantId: session.user.restaurantId,
    },
    include: {
      restaurant: true,
    },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const updatedOrder = await db.$transaction(async (tx) => {
    const next = await tx.order.update({
      where: { id: order.id },
      data: {
        status: parsed.data.status,
        ...getStatusTimestamps(parsed.data.status),
      },
    });

    await tx.orderStatusEvent.create({
      data: {
        orderId: order.id,
        status: parsed.data.status,
      },
    });

    return next;
  });

  await publishOrderEvent({
    kind: "order.updated",
    restaurantId: order.restaurantId,
    orderId: order.id,
    tokenNumber: order.tokenNumber,
    status: updatedOrder.status,
    customerName: order.customerName,
    updatedAt: updatedOrder.statusUpdatedAt.toISOString(),
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/display/${order.restaurant.slug}`);
  revalidatePath(`/r/${order.restaurant.slug}/order/${order.id}`);
}
