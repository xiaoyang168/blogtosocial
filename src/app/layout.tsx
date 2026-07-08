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
    "AI-powered tool that converts your blog posts into platform-optimized social media content for Twitter, LinkedIn, Reddit, Facebook, WeChat, and Xiaohongshu. Save 2 hours per day.",
  keywords: [
    "AI social media",
    "blog to social",
    "content repurposing",
    "DeepSeek",
    "Twitter automation",
    "LinkedIn post generator",
    "Xiaohongshu AI",
    "WeChat content",
    "social media scheduler",
    "AI copywriting",
  ],
  authors: [{ name: "BlogToSocial" }],
  creator: "BlogToSocial",
  publisher: "BlogToSocial",
  metadataBase: new URL("https://www.blogtosocial.top"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BlogToSocial - One Article, Every Platform",
    description: "AI-powered tool that converts your blog posts into platform-optimized social media content.",
    type: "website",
    url: "https://www.blogtosocial.top",
    siteName: "BlogToSocial",
    locale: "en_US",
    images: [
      {
        url: "https://www.blogtosocial.top/og-image.png",
        width: 1200,
        height: 630,
        alt: "BlogToSocial - AI-powered social media content generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BlogToSocial - One Article, Every Platform",
    description: "AI-powered tool that converts your blog posts into platform-optimized social media content.",
    images: ["https://www.blogtosocial.top/og-image.png"],
    creator: "@blogtosocial",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "google-site-verification-code", // Replace with actual code when available
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "BlogToSocial",
              description:
                "AI-powered tool that converts your blog posts into platform-optimized social media content for Twitter, LinkedIn, Reddit, Facebook, WeChat, and Xiaohongshu.",
              url: "https://www.blogtosocial.top",
              applicationCategory: "SocialMediaApplication",
              operatingSystem: "Any",
              offers: {
                "@type": "Offer",
                price: "9.99",
                priceCurrency: "USD",
                priceValidUntil: "2027-12-31",
              },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "4.8",
                ratingCount: "42",
              },
              author: {
                "@type": "Organization",
                name: "BlogToSocial",
                url: "https://www.blogtosocial.top",
              },
            }),
          }}
        />
        <Navbar />
        <main className="flex-1">{children}</main>
        <ToastContainer />
      </body>
    </html>
  );
}
