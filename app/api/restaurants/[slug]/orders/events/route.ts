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
  let heartbeat: NodeJS.Timeout | undefined;
  let closed = false;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const channel = getRestaurantOrdersChannel(restaurant.id);

      const closeStream = async () => {
        if (closed) {
          return;
        }

        closed = true;

        if (heartbeat) {
          clearInterval(heartbeat);
        }

        subscriber.removeAllListeners("message");
        await subscriber.unsubscribe(channel);
        subscriber.disconnect();
        controller.close();
      };

      request.signal.addEventListener("abort", () => {
        void closeStream();
      });

      controller.enqueue(
        sseData({
          kind: "connected",
          restaurantId: restaurant.id,
          ts: new Date().toISOString(),
        }),
      );

      await subscriber.subscribe(channel);
      subscriber.on("message", (_redisChannel, message) => {
        if (closed) {
          return;
        }

        controller.enqueue(sseData(JSON.parse(message)));
      });

      heartbeat = setInterval(() => {
        if (!closed) {
          controller.enqueue(sseComment("keepalive"));
        }
      }, 15000);
    },
    async cancel() {
      const channel = getRestaurantOrdersChannel(restaurant.id);

      if (heartbeat) {
        clearInterval(heartbeat);
      }

      subscriber.removeAllListeners("message");
      await subscriber.unsubscribe(channel);
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
