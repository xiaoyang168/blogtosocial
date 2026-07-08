import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/schedule - List user's scheduled posts
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("scheduled_posts")
      .select("*")
      .eq("user_id", user.id)
      .order("scheduled_at", { ascending: true });

    if (status) {
      query = query.eq("status", status);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Failed to fetch scheduled posts" }, { status: 500 });
    }

    return NextResponse.json({ posts: data });
  } catch (error: any) {
    console.error("Schedule GET error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/schedule - Create a new scheduled post
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { content, platform_id, scheduled_at, status = "scheduled" } = body;

    // Validation
    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }
    if (!platform_id) {
      return NextResponse.json({ error: "Platform is required" }, { status: 400 });
    }
    if (!scheduled_at) {
      return NextResponse.json({ error: "Scheduled time is required" }, { status: 400 });
    }

    const validPlatforms = ["twitter", "linkedin", "reddit", "wechat", "xiaohongshu", "facebook"];
    if (!validPlatforms.includes(platform_id)) {
      return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
    }

    const scheduledDate = new Date(scheduled_at);
    if (isNaN(scheduledDate.getTime())) {
      return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
    }

    // Check if scheduled time is in the past (allow 1 minute buffer)
    if (scheduledDate.getTime() < Date.now() - 60000) {
      return NextResponse.json({ error: "Scheduled time cannot be in the past" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scheduled_posts")
      .insert({
        user_id: user.id,
        content: content.trim(),
        platform_id,
        status,
        scheduled_at: scheduledDate.toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to create scheduled post" }, { status: 500 });
    }

    return NextResponse.json({ post: data, message: "Post scheduled successfully" }, { status: 201 });
  } catch (error: any) {
    console.error("Schedule POST error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
