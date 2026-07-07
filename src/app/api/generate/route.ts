import { NextRequest, NextResponse } from "next/server";
import { generatePosts } from "@/lib/ai";
import { platforms } from "@/lib/platforms";

export async function POST(request: NextRequest) {
  try {
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

    // Limit input text to 20000 chars
    const trimmedText = text.slice(0, 20000);

    // Generate posts
    const results = await generatePosts({
      text: trimmedText,
      selectedPlatforms,
    });

    return NextResponse.json({ results });
  } catch (error: any) {
    console.error("Generate API error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
