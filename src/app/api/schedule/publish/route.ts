import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// POST /api/schedule/publish - Manually trigger publishing of due posts
// This is also intended to be called by a cron job for auto-publishing
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // For manual publish, require auth. For cron, use a secret key.
    const authHeader = request.headers.get("x-cron-secret");
    const isCronJob = authHeader === process.env.CRON_SECRET;

    let userId: string | null = null;

    if (isCronJob) {
      // Cron job: publish all due posts for all users
      userId = null;
    } else if (user) {
      userId = user.id;
    } else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Find posts that are scheduled and past their scheduled time
    let query = supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .lte("scheduled_at", new Date().toISOString());

    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: duePosts, error: fetchError } = await query;

    if (fetchError) {
      console.error("Supabase fetch error:", fetchError);
      return NextResponse.json({ error: "Failed to fetch due posts" }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: "No posts ready to publish", published: 0 });
    }

    // Publish each post (in a real app, this would integrate with platform APIs)
    const publishedIds: string[] = [];
    const failedIds: { id: string; error: string }[] = [];

    for (const post of duePosts) {
      try {
        // TODO: In production, integrate with platform APIs (Twitter API, LinkedIn API, etc.)
        // For now, we mark them as published since we don't have platform API credentials
        const { error: updateError } = await supabase
          .from("scheduled_posts")
          .update({
            status: "published",
            published_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);

        if (updateError) throw new Error(updateError.message);
        publishedIds.push(post.id);
      } catch (err: any) {
        console.error(`Failed to publish post ${post.id}:`, err);
        await supabase
          .from("scheduled_posts")
          .update({
            status: "failed",
            error_message: err.message || "Unknown error",
            updated_at: new Date().toISOString(),
          })
          .eq("id", post.id);
        failedIds.push({ id: post.id, error: err.message || "Unknown error" });
      }
    }

    return NextResponse.json({
      message: `Publishing complete`,
      published: publishedIds.length,
      failed: failedIds.length,
      publishedIds,
      failedIds,
    });
  } catch (error: any) {
    console.error("Schedule publish error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
