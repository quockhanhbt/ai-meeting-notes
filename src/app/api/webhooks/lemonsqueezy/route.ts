import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import crypto from "crypto";

// POST /api/webhooks/lemonsqueezy
export async function POST(request: NextRequest) {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 503 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  // Verify HMAC-SHA256 signature
  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);
  const eventName: string = event?.meta?.event_name ?? "";
  const userId: string = event?.meta?.custom_data?.user_id ?? "";

  if (!userId) {
    return NextResponse.json({ error: "Missing user_id in custom data" }, { status: 400 });
  }

  if (eventName === "order_created" || eventName === "subscription_created") {
    const supabase = createAdminClient();
    await supabase
      .from("profiles")
      .update({ plan: "pro" })
      .eq("id", userId);
  }

  if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
    const supabase = createAdminClient();
    await supabase
      .from("profiles")
      .update({ plan: "free" })
      .eq("id", userId);
  }

  return NextResponse.json({ received: true });
}
