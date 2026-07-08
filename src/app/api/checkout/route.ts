import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PADDLE_API_KEY = process.env.PADDLE_API_KEY;
const PADDLE_ENVIRONMENT = process.env.PADDLE_ENVIRONMENT || "live";
const PADDLE_BASE_URL = PADDLE_ENVIRONMENT === "sandbox" ? "https://sandbox-api.paddle.com" : "https://api.paddle.com";

// Map plan IDs to Paddle Price IDs (configured via env vars)
const PLAN_PRICE_IDS: Record<string, string | undefined> = {
  pro_monthly: process.env.PADDLE_PRO_MONTHLY_PRICE_ID,
  pro_yearly: process.env.PADDLE_PRO_YEARLY_PRICE_ID,
  team_monthly: process.env.PADDLE_TEAM_MONTHLY_PRICE_ID,
  team_yearly: process.env.PADDLE_TEAM_YEARLY_PRICE_ID,
};

interface PaddleTransactionResponse {
  data: {
    id: string;
    status: string;
    checkout?: {
      url: string;
    };
  };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to upgrade your plan." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { plan } = body;

    const validPlans = ["pro_monthly", "pro_yearly", "team_monthly", "team_yearly"];
    if (!plan || !validPlans.includes(plan)) {
      return NextResponse.json(
        { error: `Invalid plan. Choose one of: ${validPlans.join(", ")}` },
        { status: 400 }
      );
    }

    const priceId = PLAN_PRICE_IDS[plan];

    // If Paddle is not configured yet, return fallback
    if (!PADDLE_API_KEY || !priceId) {
      return NextResponse.json({
        checkoutUrl: null,
        message: "Paddle checkout is being configured. Please contact us to upgrade.",
        contactEmail: "support@blogtosocial.top",
        plan: plan,
      });
    }

    // Create Paddle transaction via API
    const paddleResponse = await fetch(`${PADDLE_BASE_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${PADDLE_API_KEY}`,
      },
      body: JSON.stringify({
        items: [
          {
            price_id: priceId,
            quantity: 1,
          },
        ],
        customer: {
          email: user.email,
        },
        custom_data: {
          user_id: user.id,
          plan: plan,
        },
      }),
    });

    if (!paddleResponse.ok) {
      const errorBody = await paddleResponse.text();
      console.error("Paddle API error:", paddleResponse.status, errorBody);
      return NextResponse.json(
        { error: "Payment provider error. Please try again later." },
        { status: 502 }
      );
    }

    const paddleData = (await paddleResponse.json()) as PaddleTransactionResponse;
    const checkoutUrl = paddleData.data?.checkout?.url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      checkoutUrl,
      transactionId: paddleData.data.id,
    });
  } catch (error: any) {
    console.error("Checkout API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
