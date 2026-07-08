import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Navbar from "@/components/Navbar";
import { ToastContainer } from "@/components/Toast";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BlogToSocial - One Article, Every Platform",
  description:
    "AI-powered tool that converts your blog posts into platform-optimized social media content for Twitter, LinkedIn, Reddit, Facebook, WeChat, and Xiaohongshu.",
  keywords: ["AI", "social media", "content repurposing", "blog to social", "DeepSeek"],
  openGraph: {
    title: "BlogToSocial - One Article, Every Platform",
    description: "AI-powered tool that converts your blog posts into platform-optimized social media content.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
        <Navbar />
        <main className="flex-1">{children}</main>
        <ToastContainer />
      </body>
    </html>
  );
}
