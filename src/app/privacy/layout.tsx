import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - BlogToSocial",
  description: "Read the Privacy Policy for BlogToSocial. Learn how we protect your data and privacy.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy - BlogToSocial",
    description: "Privacy Policy for BlogToSocial.",
    type: "website",
    url: "https://www.blogtosocial.top/privacy",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
