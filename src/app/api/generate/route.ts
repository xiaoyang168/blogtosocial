import { NextRequest, NextResponse } from "next/server";
import { generatePosts } from "@/lib/ai";
import { platforms } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/server";

const FREE_DAILY_LIMIT = 3;

// Check and increment user quota
async function checkQuota(userId: string) {
  const supabase = await createClient();

  // Call the increment function — it upserts and returns whether within limit
  const { data, error } = await supabase.rpc("increment_daily_quota", {
    user_id_input: userId,
  });

  if (error) {
    console.error("Quota check error:", error);
    throw new Error("Failed to check quota");
  }

  return data as boolean;
}

// Get remaining quota for a user
async function getRemainingQuota(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("get_daily_quota", {
    user_id_input: userId,
  });

  if (error) {
    console.error("Quota fetch error:", error);
    return null;
  }

  return data[0] as { used: number; remaining: number; max_per_day: number };
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Please sign in to use this feature." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { text, platforms: selectedPlatforms } = body;

    // Validate input
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return NextResponse.json(
        { error: "Please provide article text or URL content." },
        { status: 400 }
      );
    }

    if (!selectedPlatforms || !Array.isArray(selectedPlatforms) || selectedPlatforms.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one platform." },
        { status: 400 }
      );
    }

    // Validate platform IDs
    const validIds = platforms.map((p) => p.id);
    for (const pid of selectedPlatforms) {
      if (!validIds.includes(pid)) {
        return NextResponse.json(
          { error: `Invalid platform: ${pid}. Valid options: ${validIds.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Check quota — this also increments the count
    let withinLimit: boolean;
    try {
      withinLimit = await checkQuota(user.id);
    } catch {
      // If quota table doesn't exist yet, allow without limit
      withinLimit = true;
    }

    if (!withinLimit) {
      const quotaInfo = await getRemainingQuota(user.id);
      return NextResponse.json(
        {
          error: `Daily limit reached. You've used ${quotaInfo?.used ?? FREE_DAILY_LIMIT}/${FREE_DAILY_LIMIT} free generations today. Come back tomorrow!`,
          quota: quotaInfo ?? { used: FREE_DAILY_LIMIT, remaining: 0, max_per_day: FREE_DAILY_LIMIT },
        },
        { status: 429 }
      );
    }

    // Limit input text to 20000 chars
    const trimmedText = text.slice(0, 20000);

    // Generate posts
    const results = await generatePosts({
      text: trimmedText,
      selectedPlatforms,
    });

    // Get updated quota
    const quota = await getRemainingQuota(user.id);

    return NextResponse.json({ results, quota });
  } catch (error: any) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
