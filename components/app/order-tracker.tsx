"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing, PhoneCall } from "lucide-react";

import { OrderStatus } from "@prisma/client";

import type { OrderTrackingPayload } from "@/lib/types";
import { formatCurrency, formatPhone } from "@/lib/utils";

import { OrderStatusTimeline } from "@/components/app/order-status-timeline";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type OrderEventMessage = {
  status: OrderStatus;
  updatedAt: string;
};

export function OrderTracker({ initialOrder }: { initialOrder: OrderTrackingPayload }) {
  const [order, setOrder] = useState(initialOrder);
  const readyNotifiedRef = useRef(initialOrder.status === OrderStatus.READY || initialOrder.status === OrderStatus.COMPLETED);

  useEffect(() => {
    const source = new EventSource(`/api/orders/${initialOrder.id}/events`);

    source.onmessage = (event) => {
      const payload = JSON.parse(event.data) as OrderEventMessage;

      setOrder((current) => {
        if (current.status === payload.status && current.statusUpdatedAt === payload.updatedAt) {
          return current;
        }

        return {
          ...current,
          status: payload.status,
          statusUpdatedAt: payload.updatedAt,
          events: [
            ...current.events,
            {
              id: `${payload.status}-${payload.updatedAt}`,
              status: payload.status,
              createdAt: payload.updatedAt,
            },
          ],
        };
      });
    };

    return () => {
      source.close();
    };
  }, [initialOrder.id]);

  useEffect(() => {
    if (readyNotifiedRef.current) {
      return;
    }

    if (order.status !== OrderStatus.READY && order.status !== OrderStatus.COMPLETED) {
      return;
    }

    readyNotifiedRef.current = true;

    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (Notification.permission === "granted") {
      new Notification(`Order #${order.tokenNumber} is ready`, {
        body: `${order.restaurantName} has marked your order ready for pickup.`,
      });
    }
  }, [order]);

  async function enableNotifications() {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    await Notification.requestPermission();
  }

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-br from-primary/10 via-white to-amber-100/70">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardDescription>Live order tracking</CardDescription>
              <CardTitle className="mt-1 text-3xl">Token #{order.tokenNumber}</CardTitle>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge status={order.status} />
              <Button type="button" variant="secondary" onClick={() => void enableNotifications()}>
                <BellRing className="size-4" />
                Enable ready notification
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <OrderStatusTimeline status={order.status} />
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl bg-secondary/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Guest</p>
              <p className="mt-2 font-semibold">{order.customerName}</p>
            </div>
            <div className="rounded-3xl bg-secondary/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Contact</p>
              <p className="mt-2 flex items-center gap-2 font-semibold">
                <PhoneCall className="size-4" />
                {formatPhone(order.customerPhone)}
              </p>
            </div>
            <div className="rounded-3xl bg-secondary/80 px-4 py-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Last updated</p>
              <p className="mt-2 font-semibold">{new Date(order.statusUpdatedAt).toLocaleString("en-IN")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Order summary</CardTitle>
            <CardDescription>Paid online. Kitchen updates will appear here automatically.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 rounded-3xl bg-secondary/70 px-4 py-4">
                <div>
                  <p className="font-semibold">
                    {item.quantity} x {item.nameSnapshot}
                  </p>
                  {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
                </div>
                <p className="font-semibold">{formatCurrency(item.lineTotal)}</p>
              </div>
            ))}
            {order.notes ? (
              <div className="rounded-3xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                Kitchen note: {order.notes}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment total</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold">
              <span>Total</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
