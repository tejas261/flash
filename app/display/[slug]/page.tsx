import { notFound } from "next/navigation";

import { RealtimeRefresh } from "@/components/app/realtime-refresh";
import { StatusBadge } from "@/components/app/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getReadyOrdersBySlug } from "@/lib/queries";

export default async function ReadyDisplayPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getReadyOrdersBySlug(slug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen px-6 py-8 md:px-10">
      <RealtimeRefresh url={`/api/restaurants/${slug}/orders/events`} />
      <div className="mx-auto max-w-7xl">
        <header className="surface mb-8 bg-gradient-to-r from-primary/10 via-white to-amber-100/70 px-8 py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">Pickup display</p>
          <h1 className="mt-2 font-heading text-5xl font-semibold">{data.name}</h1>
          <p className="mt-2 text-lg text-muted-foreground">Tokens listed here are ready or recently completed.</p>
        </header>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {data.orders.length ? (
            data.orders.map((order) => (
              <Card key={order.id} className="overflow-hidden bg-gradient-to-br from-white to-primary/10">
                <CardHeader>
                  <CardDescription>Token</CardDescription>
                  <CardTitle className="text-7xl">#{order.tokenNumber}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <StatusBadge status={order.status} />
                  <p className="text-sm text-muted-foreground">{order.customerName}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="md:col-span-2 xl:col-span-4">
              <CardContent className="p-12 text-center text-lg text-muted-foreground">
                No ready tokens yet. This screen updates live when the kitchen marks an order ready.
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </main>
  );
}
