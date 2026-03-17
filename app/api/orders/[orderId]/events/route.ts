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
  const channel = getOrderChannel(orderId);
  let heartbeat: NodeJS.Timeout | undefined;
  let cleanedUp = false;
  let controllerClosed = false;
  let controllerRef: ReadableStreamDefaultController<Uint8Array> | null = null;
  let abortHandler: (() => void) | undefined;

  function enqueue(chunk: Uint8Array) {
    if (!controllerRef || controllerClosed || cleanedUp) {
      return;
    }

    try {
      controllerRef.enqueue(chunk);
    } catch {
      controllerClosed = true;
      void cleanup(false);
    }
  }

  async function cleanup(closeController: boolean) {
    if (cleanedUp) {
      return;
    }

    cleanedUp = true;

    if (heartbeat) {
      clearInterval(heartbeat);
    }

    if (abortHandler) {
      request.signal.removeEventListener("abort", abortHandler);
    }

    subscriber.removeAllListeners("message");

    try {
      await subscriber.unsubscribe(channel);
    } catch {}

    subscriber.disconnect();

    if (closeController && controllerRef && !controllerClosed) {
      try {
        controllerRef.close();
      } catch {}

      controllerClosed = true;
    }
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      controllerRef = controller;

      abortHandler = () => {
        void cleanup(true);
      };

      request.signal.addEventListener("abort", abortHandler);

      enqueue(
        ssePayload({
          status: order.status,
          updatedAt: order.statusUpdatedAt.toISOString(),
        }),
      );

      await subscriber.subscribe(channel);
      subscriber.on("message", (_channel, message) => {
        if (cleanedUp) {
          return;
        }

        try {
          const parsed = JSON.parse(message) as { status: string; updatedAt: string };
          enqueue(
            ssePayload({
              status: parsed.status,
              updatedAt: parsed.updatedAt,
            }),
          );
        } catch {
          enqueue(sseComment("malformed-message"));
        }
      });

      heartbeat = setInterval(() => {
        if (!cleanedUp) {
          enqueue(sseComment("keepalive"));
        }
      }, 15000);
    },
    async cancel() {
      controllerClosed = true;
      await cleanup(false);
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
