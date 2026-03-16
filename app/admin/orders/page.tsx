import { OrderStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { AdminNav } from "@/components/app/admin-nav";
import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { StatusBadge } from "@/components/app/status-badge";
import { SubmitButton } from "@/components/app/submit-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { updateOrderStatusAction } from "@/lib/actions/orders";
import { getAdminOrdersData } from "@/lib/queries";
import { formatCurrency, formatPhone } from "@/lib/utils";

const statusOptions = [OrderStatus.NEW, OrderStatus.PREPARING, OrderStatus.READY, OrderStatus.COMPLETED];

export default async function AdminOrdersPage() {
  const session = await requireAdminSession();
  const orders = await getAdminOrdersData(session.user.restaurantId);

  if (!session.user.restaurant) {
    notFound();
  }

  const liveOrders = orders.filter((order) => order.status !== OrderStatus.COMPLETED);
  const completedOrders = orders.filter((order) => order.status === OrderStatus.COMPLETED);

  return (
    <main className="mx-auto max-w-7xl px-6 py-6 md:px-10">
      <RealtimeRefresh url={`/api/restaurants/${session.user.restaurant.slug}/orders/events`} />
      <AdminNav restaurantName={session.user.restaurant.name} userName={session.user.name} />

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Incoming orders</CardDescription>
            <CardTitle>{liveOrders.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Ready for pickup</CardDescription>
            <CardTitle>{orders.filter((order) => order.status === OrderStatus.READY).length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Completed today</CardDescription>
            <CardTitle>{completedOrders.length}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Kitchen queue</p>
          <h2 className="font-heading text-3xl font-semibold">Live orders</h2>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          {liveOrders.length ? (
            liveOrders.map((order) => (
              <Card key={order.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <CardDescription>Token #{order.tokenNumber}</CardDescription>
                      <CardTitle className="mt-1 text-2xl">{order.customerName}</CardTitle>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-3xl bg-secondary/70 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Phone</p>
                      <p className="mt-2 text-sm font-medium">{formatPhone(order.customerPhone)}</p>
                    </div>
                    <div className="rounded-3xl bg-secondary/70 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Placed</p>
                      <p className="mt-2 text-sm font-medium">{new Date(order.placedAt).toLocaleTimeString("en-IN")}</p>
                    </div>
                    <div className="rounded-3xl bg-secondary/70 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Total</p>
                      <p className="mt-2 text-sm font-medium">{formatCurrency(order.total)}</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between rounded-3xl border border-border/70 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">{item.quantity}x</Badge>
                          <span className="font-medium">{item.nameSnapshot}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{formatCurrency(item.lineTotal)}</span>
                      </div>
                    ))}
                  </div>

                  {order.notes ? (
                    <div className="rounded-3xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      Kitchen note: {order.notes}
                    </div>
                  ) : null}

                  <form action={updateOrderStatusAction} className="flex flex-col gap-3 md:flex-row">
                    <input type="hidden" name="orderId" value={order.id} />
                    <select
                      name="status"
                      defaultValue={order.status}
                      className="h-11 flex-1 rounded-2xl border border-border bg-white px-4 text-sm shadow-sm outline-none"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                    <SubmitButton pendingLabel="Updating...">Update status</SubmitButton>
                  </form>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-sm text-muted-foreground">No active orders right now.</CardContent>
            </Card>
          )}
        </div>
      </section>
    </main>
  );
}
