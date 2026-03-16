import Link from "next/link";
import { QrCode, ScanQrCode, ShieldCheck, Soup } from "lucide-react";

import { Button } from "@/components/ui/button";

const highlights = [
  {
    title: "QR-first ordering",
    description: "Guests scan, browse, pay, and track without downloading anything.",
    icon: ScanQrCode,
  },
  {
    title: "Kitchen operations",
    description: "Orders stream into the kitchen dashboard with live status management.",
    icon: Soup,
  },
  {
    title: "Admin control",
    description: "Manage categories, menu items, pricing, and the ready-token screen.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10 md:px-10">
      <header className="surface mb-8 overflow-hidden px-6 py-8 md:px-10 md:py-12">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <QrCode className="size-4" />
              Flash QR Ordering MVP
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight text-balance md:text-6xl">
                Self-service food ordering built for fast-moving restaurant floors.
              </h1>
              <p className="max-w-2xl text-base text-muted-foreground md:text-lg">
                Demo restaurant included. Staff can manage menus, receive orders, update prep status,
                and push ready notifications while guests track progress live.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/r/demo-bistro">Open sample QR menu</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/admin/login">Admin login</Link>
              </Button>
            </div>
          </div>
          <div className="surface bg-gradient-to-br from-primary/10 via-white to-amber-100/70 p-6">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                Included flow
              </p>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li>1. Scan QR and browse the restaurant menu</li>
                <li>2. Add items, checkout, and pay with Razorpay test mode</li>
                <li>3. Receive a sequential token number after payment verification</li>
                <li>4. Kitchen updates order status in real time</li>
                <li>5. Guests track progress and receive ready notifications</li>
              </ol>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {highlights.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.title} className="surface px-6 py-6">
              <div className="mb-4 inline-flex rounded-2xl bg-primary/10 p-3 text-primary">
                <Icon className="size-5" />
              </div>
              <h2 className="mb-2 font-heading text-xl font-semibold">{item.title}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
            </article>
          );
        })}
      </section>
    </main>
  );
}
