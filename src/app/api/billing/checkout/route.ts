import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

// POST /api/billing/checkout — create Lemon Squeezy checkout URL
export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_PRO_VARIANT_ID;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  if (!apiKey || !storeId || !variantId) {
    return NextResponse.json({ error: "Billing not configured" }, { status: 503 });
  }

  const response = await fetch("https://api.lemonsqueezy.com/v1/checkouts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: session.email,
            custom: { user_id: session.userId },
          },
          product_options: {
            redirect_url: `${appUrl}/dashboard?upgraded=1`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  if (!response.ok) {
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 502 });
  }

  const json = await response.json();
  return NextResponse.json({ url: json?.data?.attributes?.url });
}
