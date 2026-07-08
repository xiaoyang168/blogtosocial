import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing - BlogToSocial",
  description:
    "Choose the perfect plan for your social media content creation. Free tier available. Pro at $9.99/month. AI-powered blog to social media converter.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing - BlogToSocial",
    description: "Choose the perfect plan for your social media content creation. Free tier available.",
    type: "website",
    url: "https://www.blogtosocial.top/pricing",
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
