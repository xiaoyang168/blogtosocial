import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// Vercel Cron will call this every 5 minutes
export async function GET(request: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = request.headers.get("Authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();

    // Find scheduled posts: -30min to +15min from now, not yet reminded
    const now = new Date();
    const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
    const fifteenMinutesLater = new Date(now.getTime() + 15 * 60 * 1000);

    const { data: duePosts, error: fetchError } = await supabase
      .from("scheduled_posts")
      .select("*")
      .eq("status", "scheduled")
      .eq("reminder_sent", false)
      .lte("scheduled_at", fifteenMinutesLater.toISOString())
      .gte("scheduled_at", thirtyMinutesAgo.toISOString())
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      console.error("Cron fetch error:", fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!duePosts || duePosts.length === 0) {
      return NextResponse.json({ message: "No reminders due", sent: 0 });
    }

    // Send reminders
    const results: { id: string; email: string; status: string }[] = [];

    for (const post of duePosts) {
      // Get user email via admin API
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(
        post.user_id
      );

      const userEmail = userData?.user?.email;

      if (userError || !userEmail) {
        console.warn(`No email found for user ${post.user_id}`);
        continue;
      }
      const userName = userEmail.split("@")[0] || "there";

      try {
        const platformName = post.platform_id;
        const scheduledTime = new Date(post.scheduled_at).toLocaleString("en-US", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });

        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL || "BlogToSocial <onboarding@resend.dev>",
          to: userEmail,
          subject: `Reminder: Your ${platformName} post is scheduled for ${scheduledTime}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #7c3aed;">Hi ${userName},</h2>
              <p>This is a friendly reminder that your scheduled post is coming up soon:</p>
              <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                <p style="margin: 0;"><strong>Platform:</strong> ${platformName}</p>
                <p style="margin: 5px 0 0;"><strong>Scheduled Time:</strong> ${scheduledTime}</p>
                <p style="margin: 5px 0 0;"><strong>Content Preview:</strong> ${post.content?.substring(0, 100) || "N/A"}...</p>
              </div>
              <p>Go to your <a href="https://www.blogtosocial.top/schedule" style="color: #7c3aed;">Schedule page</a> to publish or manage this post.</p>
              <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
                You're receiving this because you scheduled a post on BlogToSocial.
              </p>
            </div>
          `,
        });

        // Mark as reminded
        await supabase
          .from("scheduled_posts")
          .update({ reminder_sent: true, reminder_sent_at: new Date().toISOString() })
          .eq("id", post.id);

        results.push({ id: post.id, email: userEmail, status: "sent" });
      } catch (emailError: any) {
        console.error(`Failed to send reminder for ${post.id}:`, emailError);
        results.push({ id: post.id, email: userEmail, status: "failed" });
      }
    }

    return NextResponse.json({
      message: "Reminders processed",
      sent: results.filter((r) => r.status === "sent").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error: any) {
    console.error("Cron error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
