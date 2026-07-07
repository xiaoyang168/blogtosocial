import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ used: 0, remaining: 0, max_per_day: 3, signedIn: false });
    }

    const { data, error } = await supabase.rpc("get_daily_quota", {
      user_id_input: user.id,
    });

    if (error) {
      // Table not created yet — return unlimited
      return NextResponse.json({ used: 0, remaining: 3, max_per_day: 3, signedIn: true });
    }

    return NextResponse.json({
      ...data[0],
      signedIn: true,
    });
  } catch {
    return NextResponse.json({ used: 0, remaining: 3, max_per_day: 3, signedIn: false });
  }
}
