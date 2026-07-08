import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Schedule - BlogToSocial",
  description:
    "Plan and schedule your social media posts. Manage your content calendar for Twitter, LinkedIn, Reddit, Facebook, WeChat, and Xiaohongshu.",
  alternates: {
    canonical: "/schedule",
  },
  openGraph: {
    title: "Content Schedule - BlogToSocial",
    description: "Plan and schedule your social media posts with our content calendar.",
    type: "website",
    url: "https://www.blogtosocial.top/schedule",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function ScheduleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
