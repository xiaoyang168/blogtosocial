"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface PlanFeature {
  text: string;
  included: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  price: string;
  period: string;
  monthlyPrice: string;
  yearlyPrice?: string;
  yearlyPeriod?: string;
  features: PlanFeature[];
  popular?: boolean;
  cta: string;
}

const plans: Plan[] = [
  {
    id: "free",
    name: "Free",
    description: "For personal creators just getting started.",
    price: "$0",
    period: "/forever",
    monthlyPrice: "$0",
    features: [
      { text: "3 generations per day", included: true },
      { text: "6 platforms (Twitter, LinkedIn, Reddit, WeChat, Xiaohongshu, Facebook)", included: true },
      { text: "One-click copy", included: true },
      { text: "Basic AI rewriting", included: true },
      { text: "History & saved posts", included: false },
      { text: "Batch export", included: false },
      { text: "API access", included: false },
    ],
    cta: "Get Started",
  },
  {
    id: "pro_monthly",
    name: "Pro",
    description: "For serious creators growing their audience.",
    price: "$9.99",
    period: "/month",
    monthlyPrice: "$9.99/mo",
    yearlyPrice: "$79",
    yearlyPeriod: "/year",
    popular: true,
    features: [
      { text: "30 generations per day", included: true },
      { text: "All 6 platforms", included: true },
      { text: "One-click copy + Copy all", included: true },
      { text: "Advanced AI rewriting", included: true },
      { text: "Full history & saved posts", included: true },
      { text: "Batch export (Markdown, TXT)", included: true },
      { text: "API access", included: false },
    ],
    cta: "Upgrade to Pro",
  },
  {
    id: "team_monthly",
    name: "Team",
    description: "For teams and agencies managing multiple accounts.",
    price: "$29.99",
    period: "/month",
    monthlyPrice: "$29.99/mo",
    yearlyPrice: "$249",
    yearlyPeriod: "/year",
    features: [
      { text: "100 generations per day", included: true },
      { text: "All 6 platforms", included: true },
      { text: "One-click copy + Copy all", included: true },
      { text: "Advanced AI rewriting", included: true },
      { text: "Full history & saved posts", included: true },
      { text: "Batch export (Markdown, TXT, JSON)", included: true },
      { text: "API access + team collaboration", included: true },
    ],
    cta: "Upgrade to Team",
  },
];

function CheckIcon() {
  return (
    <svg className="w-5 h-5 text-emerald-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-5 h-5 text-zinc-300 dark:text-zinc-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

export default function PricingPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [isYearly, setIsYearly] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });
  }, []);

  const getPlanId = (baseId: string) => {
    if (baseId === "free") return "free";
    return isYearly ? baseId.replace("_monthly", "_yearly") : baseId;
  };

  const handleCheckout = async (planId: string) => {
    if (!user) {
      window.location.href = "/sign-up?redirect=/pricing";
      return;
    }

    if (planId === "free") {
      window.location.href = "/";
      return;
    }

    const checkoutPlanId = getPlanId(planId);
    setLoading(planId);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: checkoutPlanId }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Checkout failed");
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.message) {
        alert(data.message + "\n\nContact: " + data.contactEmail);
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      alert(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-20 pb-10 text-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-4xl px-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Simple, <span className="gradient-text">transparent</span> pricing
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto">
            Start free. Upgrade when you are ready. No hidden fees, cancel anytime.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                !isYearly
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                isYearly
                  ? "bg-white dark:bg-zinc-700 text-zinc-900 dark:text-white shadow-sm"
                  : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Yearly
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-400 font-semibold">
                Save 2 months
              </span>
            </button>
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 pb-24">
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const isYearlyPlan = isYearly && plan.yearlyPrice;
            const displayPrice = isYearlyPlan ? plan.yearlyPrice : plan.price;
            const displayPeriod = isYearlyPlan ? plan.yearlyPeriod : plan.period;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl border p-6 flex flex-col ${
                  plan.popular
                    ? "border-purple-300 dark:border-purple-700 bg-gradient-to-b from-purple-50/50 to-white dark:from-purple-950/20 dark:to-zinc-900 shadow-lg shadow-purple-500/5"
                    : "border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900"
                }`}
              >
                {/* Popular badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs font-semibold shadow-md">
                      <SparkleIcon />
                      Most Popular
                    </span>
                  </div>
                )}

                {/* Plan header */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{plan.description}</p>
                </div>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-3xl font-bold">{displayPrice}</span>
                  <span className="text-zinc-400 dark:text-zinc-500 text-sm">{displayPeriod}</span>
                  {isYearlyPlan && plan.yearlyPrice && (
                    <p className="text-xs text-zinc-400 mt-1">
                      Billed annually
                    </p>
                  )}
                </div>

                {/* Features */}
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-start gap-3">
                      {feature.included ? <CheckIcon /> : <XIcon />}
                      <span className={`text-sm ${feature.included ? "" : "text-zinc-400 dark:text-zinc-500"}`}>
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <button
                  onClick={() => handleCheckout(plan.id)}
                  disabled={!!loading}
                  className={`w-full py-2.5 rounded-xl font-medium text-sm transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98]"
                      : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                  } disabled:opacity-50`}
                >
                  {loading === plan.id ? "Loading..." : plan.cta}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ teaser */}
        <div className="mt-16 text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Questions? Contact us at{" "}
            <a href="mailto:support@blogtosocial.top" className="text-purple-600 dark:text-purple-400 hover:underline">
              support@blogtosocial.top
            </a>
          </p>
        </div>
      </section>
    </div>
  );
}
