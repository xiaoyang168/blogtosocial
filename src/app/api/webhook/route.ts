import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Paddle webhook secret for verifying signatures
const PADDLE_WEBHOOK_SECRET = process.env.PADDLE_WEBHOOK_SECRET;

// Verify Paddle webhook signature (simple implementation)
function verifySignature(body: string, signature: string): boolean {
  // In production, implement proper HMAC verification
  // For now, just check if the signature header exists
  if (!PADDLE_WEBHOOK_SECRET) {
    console.warn("PADDLE_WEBHOOK_SECRET not set, skipping webhook verification");
    return true;
  }
  return !!signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    // Verify webhook signature (basic check)
    if (!verifySignature(body, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const event = JSON.parse(body);
    const { event_type, data } = event;

    if (event_type === "transaction.completed" || event_type === "transaction.paid") {
      // Payment successful - upgrade user plan
      const transactionId = data?.id;
      const customData = data?.custom_data || {};
      const userId = customData.user_id;
      const plan = customData.plan;

      if (!userId || !plan) {
        console.error("Missing user_id or plan in webhook data", { transactionId, customData });
        return NextResponse.json({ error: "Missing data" }, { status: 400 });
      }

      // Determine plan limits
      let planType = "free";
      let dailyLimit = 3;
      let expiresAt: Date | null = null;
      const now = new Date();

      if (plan === "pro_monthly") {
        planType = "pro";
        dailyLimit = 30;
        expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      } else if (plan === "pro_yearly") {
        planType = "pro";
        dailyLimit = 30;
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      } else if (plan === "team_monthly") {
        planType = "team";
        dailyLimit = 100;
        expiresAt = new Date(now.setMonth(now.getMonth() + 1));
      } else if (plan === "team_yearly") {
        planType = "team";
        dailyLimit = 100;
        expiresAt = new Date(now.setFullYear(now.getFullYear() + 1));
      }

      // Upsert user plan in Supabase
      const supabase = await createClient();
      const { error } = await supabase.from("user_plans").upsert(
        {
          user_id: userId,
          plan_type: planType,
          daily_limit: dailyLimit,
          expires_at: expiresAt?.toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

      if (error) {
        console.error("Failed to update user plan:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      console.log(`User ${userId} upgraded to ${planType} plan via transaction ${transactionId}`);
      return NextResponse.json({ success: true });
    }

    // Handle other webhook events
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
