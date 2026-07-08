import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - BlogToSocial",
  description: "Read the Terms of Service for BlogToSocial, the AI-powered social media content generator.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service - BlogToSocial",
    description: "Terms of Service for BlogToSocial.",
    type: "website",
    url: "https://www.blogtosocial.top/terms",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
