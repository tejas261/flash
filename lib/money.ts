import { TAX_RATE_BPS } from "@/lib/constants";

export function calculateOrderPricing(subtotal: number) {
  const tax = Math.round((subtotal * TAX_RATE_BPS) / 10000);
  const total = subtotal + tax;

  return { subtotal, tax, total };
}
