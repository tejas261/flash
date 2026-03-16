import Link from "next/link";

import { AdminNav } from "@/components/app/admin-nav";
import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAdminSession } from "@/lib/auth";
import { getReadyOrdersBySlug } from "@/lib/queries";

export default async function AdminDisplayPage() {
  const session = await requireAdminSession();
  const data = await getReadyOrdersBySlug(session.user.restaurant.slug);

  return (
    <main className="mx-auto max-w-7xl px-6 py-6 md:px-10">
      <RealtimeRefresh url={`/api/restaurants/${session.user.restaurant.slug}/orders/events`} />
      <AdminNav restaurantName={session.user.restaurant.name} userName={session.user.name} />

      <section className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Ready token display</p>
          <h2 className="font-heading text-3xl font-semibold">Full-screen pickup board preview</h2>
        </div>
        <Button asChild>
          <Link href={`/display/${session.user.restaurant.slug}`} target="_blank">
            Open public display
          </Link>
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {data?.orders.length ? (
          data.orders.map((order) => (
            <Card key={order.id} className="bg-gradient-to-br from-white via-white to-primary/10">
              <CardHeader>
                <CardDescription>Token</CardDescription>
                <CardTitle className="text-5xl">#{order.tokenNumber}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <StatusBadge status={order.status} />
                <p className="text-sm text-muted-foreground">{order.customerName}</p>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="md:col-span-3">
            <CardContent className="p-8 text-sm text-muted-foreground">No ready orders yet.</CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
