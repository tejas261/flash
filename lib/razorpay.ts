import Razorpay from "razorpay";

import { env } from "@/lib/env";

declare global {
  var razorpay: Razorpay | undefined;
}

export function getRazorpayClient() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET || !env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
    throw new Error("Razorpay environment variables are missing.");
  }

  if (!globalThis.razorpay) {
    globalThis.razorpay = new Razorpay({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    });
  }

  return globalThis.razorpay;
}
