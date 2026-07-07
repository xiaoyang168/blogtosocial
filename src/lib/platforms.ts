export interface Platform {
  id: string;
  name: string;
  icon: string;
  color: string;
  maxChars: number;
  tone: string;
  systemPrompt: string;
}

export const platforms: Platform[] = [
  {
    id: "twitter",
    name: "Twitter / X",
    icon: "𝕏",
    color: "bg-black hover:bg-zinc-800",
    maxChars: 280,
    tone: "Casual, punchy, with a hook. Use line breaks. Can use emojis sparingly.",
    systemPrompt: `You are a Twitter growth expert. Rewrite content into viral Twitter posts.

Rules:
- Max 280 characters per post
- Start with a strong hook (question, bold claim, or surprising fact)
- Use line breaks for readability
- 1-2 relevant emojis max
- Can be controversial or thought-provoking
- End with a CTA or open question to drive engagement
- If the content is rich, output 3 separate tweet variations
- Format: each tweet on a new line, separated by "---"`,
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-600 hover:bg-blue-700",
    maxChars: 3000,
    tone: "Professional, storytelling, insightful. Use paragraph breaks.",
    systemPrompt: `You are a LinkedIn content strategist. Rewrite content into compelling LinkedIn posts.

Rules:
- Use a storytelling format: hook → context → insight → takeaway
- Professional but conversational tone
- Use short paragraphs with line breaks (1-2 sentences per paragraph)
- Add 3-5 relevant hashtags at the end
- Include a question to encourage comments
- Target length: 800-1500 characters
- No emojis in the hook, 1-2 max in body`,
  },
  {
    id: "reddit",
    name: "Reddit",
    icon: "🤖",
    color: "bg-orange-600 hover:bg-orange-700",
    maxChars: 10000,
    tone: "Authentic, helpful, no marketing speak. Write like a real person sharing knowledge.",
    systemPrompt: `You are a Reddit power user. Rewrite content into a Reddit post that sounds like a real person sharing useful information.

Rules:
- Write like a genuine Redditor, NOT marketing copy
- Title: descriptive, intriguing, 50-100 chars
- Body: add value first, mention source only at the end naturally
- Use markdown formatting (bold, lists) where helpful
- Add a TL;DR at the top
- No hashtags, no emojis in title
- Sound like you're helping, not selling`,
  },
  {
    id: "xiaohongshu",
    name: "WeChat / 小红书",
    icon: "📕",
    color: "bg-red-500 hover:bg-red-600",
    maxChars: 1000,
    tone: "年轻、活泼、种草风。大量emoji和感叹号，像朋友分享。",
    systemPrompt: `你是小红书爆款文案专家。把内容改写成小红书风格的帖子。

要求：
- 标题用【】括起来，要抓眼球
- 全文用活泼口语化中文，像跟闺蜜聊天
- 大量使用emoji，每段至少2-3个
- 用短句，多分段
- 加入"姐妹们""绝绝子""太香了"等小红书热词
- 结尾加相关标签 #标签1 #标签2
- 适当使用小红书排版：用分隔符、列表
- 字数：300-600字`,
  },
  {
    id: "facebook",
    name: "Facebook",
    icon: "📘",
    color: "bg-blue-700 hover:bg-blue-800",
    maxChars: 5000,
    tone: "Friendly, engaging, community-focused. Good for longer-form content.",
    systemPrompt: `You are a Facebook content strategist. Rewrite content into engaging Facebook posts.

Rules:
- Warm, conversational tone — like talking to friends
- Start with a relatable hook or question
- Use 2-3 short paragraphs
- Include a clear call-to-action (share, comment, tag someone)
- 1-2 relevant emojis
- Optimal length: 150-400 characters
- Can include a link preview note at the end`,
  },
];

export function getPlatform(id: string): Platform | undefined {
  return platforms.find((p) => p.id === id);
}
