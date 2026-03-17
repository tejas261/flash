import { NextResponse } from "next/server";

import { getRestaurantBySlug } from "@/lib/queries";
import { createRedisSubscriber } from "@/lib/redis";
import { getRestaurantOrdersChannel } from "@/lib/order-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

function sseData(payload: unknown) {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function sseComment(comment: string) {
  return encoder.encode(`: ${comment}\n\n`);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const subscriber = createRedisSubscriber();
  const channel = getRestaurantOrdersChannel(restaurant.id);
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
        sseData({
          kind: "connected",
          restaurantId: restaurant.id,
          ts: new Date().toISOString(),
        }),
      );

      await subscriber.subscribe(channel);
      subscriber.on("message", (_redisChannel, message) => {
        if (cleanedUp) {
          return;
        }

        enqueue(sseData(JSON.parse(message)));
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
