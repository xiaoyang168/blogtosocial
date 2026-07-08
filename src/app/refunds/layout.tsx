import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy - BlogToSocial",
  description: "Read the Refund Policy for BlogToSocial. Learn about our refund terms and conditions.",
  alternates: {
    canonical: "/refunds",
  },
  openGraph: {
    title: "Refund Policy - BlogToSocial",
    description: "Refund Policy for BlogToSocial.",
    type: "website",
    url: "https://www.blogtosocial.top/refunds",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function RefundsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
