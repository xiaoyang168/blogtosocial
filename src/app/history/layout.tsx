import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Generation History - BlogToSocial",
  description:
    "View all your AI-generated social media posts history. Restore and reuse previous content for Twitter, LinkedIn, Reddit, Facebook, WeChat, and Xiaohongshu.",
  alternates: {
    canonical: "/history",
  },
  openGraph: {
    title: "Generation History - BlogToSocial",
    description: "View and manage your AI-generated social media content history.",
    type: "website",
    url: "https://www.blogtosocial.top/history",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
