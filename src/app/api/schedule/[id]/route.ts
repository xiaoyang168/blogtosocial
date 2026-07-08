import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// PUT /api/schedule/[id] - Update a scheduled post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { content, platform_id, scheduled_at, status } = body;

    // Check if post exists and belongs to user
    const { data: existingPost, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("id, status")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPost) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Cannot edit published posts
    if (existingPost.status === "published") {
      return NextResponse.json({ error: "Cannot edit published posts" }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (content !== undefined) updates.content = content.trim();
    if (platform_id !== undefined) updates.platform_id = platform_id;
    if (status !== undefined) updates.status = status;
    if (scheduled_at !== undefined) {
      const scheduledDate = new Date(scheduled_at);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ error: "Invalid scheduled time" }, { status: 400 });
      }
      if (scheduledDate.getTime() < Date.now() - 60000) {
        return NextResponse.json({ error: "Scheduled time cannot be in the past" }, { status: 400 });
      }
      updates.scheduled_at = scheduledDate.toISOString();
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from("scheduled_posts")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return NextResponse.json({ error: "Failed to update scheduled post" }, { status: 500 });
    }

    return NextResponse.json({ post: data, message: "Post updated successfully" });
  } catch (error: any) {
    console.error("Schedule PUT error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/schedule/[id] - Delete a scheduled post
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { error } = await supabase
      .from("scheduled_posts")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Supabase delete error:", error);
      return NextResponse.json({ error: "Failed to delete scheduled post" }, { status: 500 });
    }

    return NextResponse.json({ message: "Post deleted successfully" });
  } catch (error: any) {
    console.error("Schedule DELETE error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
