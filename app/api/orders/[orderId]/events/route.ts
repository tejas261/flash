import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { createRedisSubscriber } from "@/lib/redis";
import { getOrderChannel } from "@/lib/order-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function ssePayload(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseComment(comment: string) {
  return encoder.encode(`: ${comment}\n\n`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  const { orderId } = await params;
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      status: true,
      statusUpdatedAt: true,
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const subscriber = createRedisSubscriber();
  let heartbeat: NodeJS.Timeout | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const closeStream = async () => {
        if (closed) {
          return;
        }

        closed = true;

        if (heartbeat) {
          clearInterval(heartbeat);
        }

        subscriber.removeAllListeners("message");
        await subscriber.unsubscribe(getOrderChannel(orderId));
        subscriber.disconnect();
        controller.close();
      };

      request.signal.addEventListener("abort", () => {
        void closeStream();
      });

      controller.enqueue(
        ssePayload({
          status: order.status,
          updatedAt: order.statusUpdatedAt.toISOString(),
        }),
      );

      await subscriber.subscribe(getOrderChannel(orderId));
      subscriber.on("message", (_channel, message) => {
        if (closed) {
          return;
        }

        try {
          const parsed = JSON.parse(message) as { status: string; updatedAt: string };
          controller.enqueue(
            ssePayload({
              status: parsed.status,
              updatedAt: parsed.updatedAt,
            }),
          );
        } catch {
          controller.enqueue(sseComment("malformed-message"));
        }
      });

      heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(sseComment("keepalive"));
        }
      }, 15000);
    },
    async cancel() {
      if (heartbeat) {
        clearInterval(heartbeat);
      }

      subscriber.removeAllListeners("message");
      await subscriber.unsubscribe(getOrderChannel(orderId));
      subscriber.disconnect();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream",
    },
  });
}
