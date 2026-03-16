import QRCode from "qrcode";
import { NextResponse } from "next/server";

import { env } from "@/lib/env";
import { getRestaurantBySlug } from "@/lib/queries";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);

  if (!restaurant) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const targetUrl = `${env.NEXT_PUBLIC_APP_URL}/r/${restaurant.slug}`;
  const svg = await QRCode.toString(targetUrl, {
    margin: 1,
    type: "svg",
    color: {
      dark: "#111111",
      light: "#FFFFFF",
    },
  });

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
