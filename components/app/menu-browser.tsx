"use client";

import { startTransition, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

import type { PublicMenuData } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

type CartState = Record<string, number>;

type CheckoutResponse = {
  checkoutSessionId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  restaurantName: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export function MenuBrowser({ restaurant }: { restaurant: PublicMenuData }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartState>({});
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const items = restaurant.categories.flatMap((category) => category.items);
  const cartEntries = items
    .map((item) => ({
      ...item,
      quantity: cart[item.id] ?? 0,
    }))
    .filter((item) => item.quantity > 0);
  const subtotal = cartEntries.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;
  const totalItems = cartEntries.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(itemId: string, delta: number) {
    setCart((current) => {
      const nextValue = Math.max((current[itemId] ?? 0) + delta, 0);
      const next = { ...current };

      if (nextValue === 0) {
        delete next[itemId];
      } else {
        next[itemId] = nextValue;
      }

      return next;
    });
  }

  async function handleCheckout() {
    if (!window.Razorpay) {
      toast.error("Razorpay checkout script did not load.");
      return;
    }

    if (!cartEntries.length) {
      toast.error("Add at least one item to continue.");
      return;
    }

    setIsPaying(true);

    try {
      const sessionResponse = await fetch("/api/checkout/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantSlug: restaurant.slug,
          customerName,
          customerPhone,
          notes,
          items: cartEntries.map((item) => ({
            menuItemId: item.id,
            quantity: item.quantity,
          })),
        }),
      });

      if (!sessionResponse.ok) {
        const payload = (await sessionResponse.json()) as { error?: string };
        throw new Error(payload.error ?? "Unable to initialize checkout.");
      }

      const session = (await sessionResponse.json()) as CheckoutResponse;

      const razorpay = new window.Razorpay({
        key: session.keyId,
        amount: session.amount,
        currency: session.currency,
        name: session.restaurantName,
        description: `Order for ${restaurant.name}`,
        order_id: session.razorpayOrderId,
        theme: {
          color: restaurant.themeColor,
        },
        prefill: {
          name: customerName,
          contact: customerPhone,
        },
        handler: async (response: Record<string, string>) => {
          const verifyResponse = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              checkoutSessionId: session.checkoutSessionId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const payload = (await verifyResponse.json()) as { orderId?: string; error?: string };

          if (!verifyResponse.ok || !payload.orderId) {
            throw new Error(payload.error ?? "Payment verification failed.");
          }

          toast.success("Payment verified. Tracking your order now.");
          setCart({});
          setIsCheckoutOpen(false);
          startTransition(() => {
            router.push(`/r/${restaurant.slug}/order/${payload.orderId}`);
          });
        },
        modal: {
          ondismiss: () => {
            setIsPaying(false);
          },
        },
      });

      razorpay.open();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to start payment.";
      toast.error(message);
      setIsPaying(false);
      return;
    }

    setIsPaying(false);
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <div className="space-y-8">
        <section className="surface overflow-hidden">
          <div
            className="grid gap-8 px-6 py-8 md:px-8 md:py-10 lg:grid-cols-[1.15fr_0.85fr]"
            style={{
              background: `linear-gradient(135deg, ${restaurant.themeColor}16, rgba(255,255,255,0.92))`,
            }}
          >
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="size-4" />
                Scan. Order. Pick up.
              </div>
              <h1 className="max-w-3xl font-heading text-4xl font-semibold tracking-tight md:text-5xl">
                {restaurant.heroTitle ?? restaurant.name}
              </h1>
              <p className="max-w-2xl text-base leading-7 text-muted-foreground">
                {restaurant.heroDescription ?? restaurant.description ?? "Freshly prepared dishes ready for quick pickup."}
              </p>
            </div>

            <div className="surface bg-white/70 p-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Ready for self-service
              </p>
              <p className="mb-6 text-3xl font-heading font-semibold">{restaurant.categories.length} menu sections live</p>
              <div className="grid gap-3 text-sm text-muted-foreground">
                <div className="rounded-2xl bg-secondary/80 px-4 py-3">Pay online with Razorpay test mode</div>
                <div className="rounded-2xl bg-secondary/80 px-4 py-3">Track status live from your browser</div>
                <div className="rounded-2xl bg-secondary/80 px-4 py-3">Receive a token number after successful payment</div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {restaurant.categories.map((category) => (
              <section key={category.id} className="space-y-4">
                <div className="flex items-end justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Menu</p>
                    <h2 className="font-heading text-2xl font-semibold">{category.name}</h2>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  {category.items.map((item) => {
                    const quantity = cart[item.id] ?? 0;

                    return (
                      <article key={item.id} className="surface overflow-hidden">
                        {item.imageUrl ? (
                          <div className="relative h-48 w-full">
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                            />
                          </div>
                        ) : null}
                        <div className="space-y-4 p-5">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <div className="mb-2 flex flex-wrap items-center gap-2">
                                <h3 className="font-heading text-xl font-semibold">{item.name}</h3>
                                {item.isFeatured ? (
                                  <span className="rounded-full bg-primary/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
                                    Popular
                                  </span>
                                ) : null}
                              </div>
                              {item.description ? (
                                <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                              ) : null}
                            </div>
                            <p className="whitespace-nowrap text-lg font-semibold">{formatCurrency(item.price, restaurant.currency)}</p>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                              {item.spiceLevel ? `Spice ${item.spiceLevel}/5` : "Chef special"}
                            </div>
                            <div className="flex items-center gap-2">
                              <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(item.id, -1)}>
                                <Minus className="size-4" />
                              </Button>
                              <div className="min-w-10 text-center text-sm font-semibold">{quantity}</div>
                              <Button type="button" size="icon" onClick={() => updateQuantity(item.id, 1)}>
                                <Plus className="size-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="surface sticky top-6 h-fit p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Cart</p>
                <h2 className="font-heading text-2xl font-semibold">{totalItems} items</h2>
              </div>
              <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                <ShoppingBag className="size-5" />
              </div>
            </div>

            <div className="space-y-3">
              {cartEntries.length ? (
                cartEntries.map((item) => (
                  <div key={item.id} className="rounded-3xl bg-secondary/80 px-4 py-4">
                    <div className="mb-2 flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(item.price, restaurant.currency)} each
                        </p>
                      </div>
                      <p className="font-semibold">{formatCurrency(item.price * item.quantity, restaurant.currency)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button type="button" variant="outline" size="icon" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="size-4" />
                      </Button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <Button type="button" size="icon" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                  Your cart is empty. Add dishes to continue.
                </div>
              )}
            </div>

            <Separator className="my-5" />

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal, restaurant.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span>{formatCurrency(tax, restaurant.currency)}</span>
              </div>
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Total</span>
                <span>{formatCurrency(total, restaurant.currency)}</span>
              </div>
            </div>

            <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
              <DialogTrigger asChild>
                <Button className="mt-5 w-full" size="lg" disabled={!cartEntries.length}>
                  <Wallet className="size-4" />
                  Checkout & pay
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Guest checkout</DialogTitle>
                  <DialogDescription>
                    Payment is captured via Razorpay test mode. Order creation happens after successful verification.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="customerName">Name</Label>
                    <Input id="customerName" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="customerPhone">Phone</Label>
                    <Input
                      id="customerPhone"
                      inputMode="numeric"
                      maxLength={10}
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value.replace(/\D/g, "").slice(0, 10))}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="notes">Order notes</Label>
                    <Textarea id="notes" value={notes} onChange={(event) => setNotes(event.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="secondary" onClick={() => setIsCheckoutOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => void handleCheckout()}
                    disabled={isPaying || !customerName || customerPhone.length !== 10 || !cartEntries.length}
                  >
                    {isPaying ? "Starting payment..." : `Pay ${formatCurrency(total, restaurant.currency)}`}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </aside>
        </section>
      </div>
    </>
  );
}
