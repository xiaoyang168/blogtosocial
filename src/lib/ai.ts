import { Platform, platforms } from "@/lib/platforms";

interface GenerateResult {
  platform: Platform;
  content: string;
  error?: string;
}

interface GenerateOptions {
  text: string;
  selectedPlatforms: string[];
}

/**
 * Generate social media posts for selected platforms using DeepSeek API.
 */
export async function generatePosts(options: GenerateOptions): Promise<GenerateResult[]> {
  const { text, selectedPlatforms } = options;
  const targets = platforms.filter((p) => selectedPlatforms.includes(p.id));

  const results: GenerateResult[] = [];

  for (const platform of targets) {
    try {
      const content = await callDeepSeek(text, platform);
      results.push({ platform, content });
    } catch (error: any) {
      console.error(`Failed to generate for ${platform.name}:`, error.message);
      results.push({
        platform,
        content: "",
        error: error.message || "Generation failed",
      });
    }
  }

  return results;
}

async function callDeepSeek(text: string, platform: Platform): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1";

  if (!apiKey || apiKey === "your_deepseek_api_key_here") {
    throw new Error("DEEPSEEK_API_KEY is not configured. Please set it in .env.local");
  }

  // Truncate input if too long (DeepSeek context is 64K, we keep input reasonable)
  const maxInputChars = 8000;
  const truncatedText = text.length > maxInputChars ? text.slice(0, maxInputChars) + "..." : text;

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages: [
        {
          role: "system",
          content: platform.systemPrompt,
        },
        {
          role: "user",
          content: `Here is the content to repurpose:\n\n${truncatedText}\n\nGenerate ${platform.name} posts based on the rules above.`,
        },
      ],
      temperature: 0.8,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`DeepSeek API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error("Empty response from DeepSeek");
  }

  return content.trim();
}
