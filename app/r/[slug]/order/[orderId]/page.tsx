import Link from "next/link";
import { notFound } from "next/navigation";

import { OrderTracker } from "@/components/app/order-tracker";
import { Button } from "@/components/ui/button";
import { getOrderTrackingData } from "@/lib/queries";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ slug: string; orderId: string }>;
}) {
  const { slug, orderId } = await params;
  const order = await getOrderTrackingData(orderId);

  if (!order || order.restaurant.slug !== slug) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-8 md:px-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Customer view</p>
          <h1 className="font-heading text-3xl font-semibold">{order.restaurant.name}</h1>
        </div>
        <Button asChild variant="secondary">
          <Link href={`/r/${slug}`}>Order again</Link>
        </Button>
      </div>

      <OrderTracker
        initialOrder={{
          id: order.id,
          restaurantName: order.restaurant.name,
          restaurantSlug: order.restaurant.slug,
          tokenNumber: order.tokenNumber,
          status: order.status,
          customerName: order.customerName,
          customerPhone: order.customerPhone,
          notes: order.notes,
          subtotal: order.subtotal,
          tax: order.tax,
          total: order.total,
          placedAt: order.placedAt.toISOString(),
          statusUpdatedAt: order.statusUpdatedAt.toISOString(),
          items: order.items.map((item) => ({
            id: item.id,
            nameSnapshot: item.nameSnapshot,
            quantity: item.quantity,
            lineTotal: item.lineTotal,
            notes: item.notes,
          })),
          events: order.events.map((event) => ({
            id: event.id,
            status: event.status,
            createdAt: event.createdAt.toISOString(),
          })),
        }}
      />
    </main>
  );
}
