import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { CheckoutStatus } from "@/generated/prisma/enums";

import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { finalizeVerifiedCheckout } from "@/lib/checkout";
import { paymentVerifySchema } from "@/lib/validations";

export const runtime = "nodejs";

function isSignatureValid(orderId: string, paymentId: string, signature: string) {
  const digest = createHmac("sha256", env.RAZORPAY_KEY_SECRET ?? "")
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  if (digest.length !== signature.length) {
    return false;
  }

  return timingSafeEqual(Buffer.from(digest), Buffer.from(signature));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = paymentVerifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid payment payload." },
        { status: 400 },
      );
    }

    const session = await db.checkoutSession.findUnique({
      where: { id: parsed.data.checkoutSessionId },
      include: { order: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Checkout session not found." }, { status: 404 });
    }

    if (session.order) {
      return NextResponse.json({ orderId: session.order.id, tokenNumber: session.order.tokenNumber });
    }

    if (session.razorpayOrderId !== parsed.data.razorpayOrderId) {
      return NextResponse.json({ error: "Razorpay order mismatch." }, { status: 400 });
    }

    if (!isSignatureValid(parsed.data.razorpayOrderId, parsed.data.razorpayPaymentId, parsed.data.razorpaySignature)) {
      await db.checkoutSession.update({
        where: { id: session.id },
        data: {
          status: CheckoutStatus.FAILED,
        },
      });

      return NextResponse.json({ error: "Invalid Razorpay signature." }, { status: 400 });
    }

    await db.checkoutSession.update({
      where: { id: session.id },
      data: {
        razorpayPaymentId: parsed.data.razorpayPaymentId,
        razorpaySignature: parsed.data.razorpaySignature,
      },
    });

    const order = await finalizeVerifiedCheckout(session.id, parsed.data.razorpayPaymentId);
    return NextResponse.json({ orderId: order.id, tokenNumber: order.tokenNumber });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to verify payment.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
