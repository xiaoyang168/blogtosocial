"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { platforms } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { showToast } from "@/components/Toast";
import type { User } from "@supabase/supabase-js";

interface GenerateResult {
  platform: { id: string; name: string; icon: string; color: string };
  content: string;
  error?: string;
}

interface QuotaInfo {
  used: number;
  remaining: number;
  max_per_day: number;
  signedIn: boolean;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
    </svg>
  );
}

interface HistoryPost {
  id: string;
  source_text: string;
  results: Record<string, any>;
  platforms: string[];
  created_at: string;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [inputText, setInputText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    platforms.map((p) => p.id)
  );
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [quota, setQuota] = useState<QuotaInfo>({
    used: 0,
    remaining: 3,
    max_per_day: 3,
    signedIn: false,
  });
  const [history, setHistory] = useState<HistoryPost[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Fetch quota
  const fetchQuota = useCallback(async () => {
    try {
      const res = await fetch("/api/quota");
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch {
      // ignore
    }
  }, []);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    try {
      setHistoryLoading(true);
      const res = await fetch("/api/history?limit=6");
      if (res.ok) {
        const data = await res.json();
        setHistory(data.posts || []);
      }
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setUserLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchQuota();
          fetchHistory();
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchQuota, fetchHistory]);

  useEffect(() => {
    if (user) {
      fetchQuota();
      fetchHistory();
    }
  }, [user, fetchQuota, fetchHistory]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const togglePlatform = (id: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) {
      setError("Please paste some content first.");
      return;
    }
    if (selectedPlatforms.length === 0) {
      setError("Please select at least one platform.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          platforms: selectedPlatforms,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.quota) setQuota(data.quota);
        throw new Error(data.error || "Generation failed");
      }

      setResults(data.results);
      if (data.quota) setQuota(data.quota);
      fetchHistory(); // Refresh history after generation

      // Scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 200);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText, selectedPlatforms]);

  const handleCopy = async (text: string, platformId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(platformId);
    showToast("Copied to clipboard!", "success");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyAll = async () => {
    const allText = results
      .filter((r) => !r.error)
      .map((r) => `【${r.platform.name}】\n\n${r.content}\n`)
      .join("\n---\n\n");
    await navigator.clipboard.writeText(allText);
    setCopiedAll(true);
    showToast("All posts copied!", "success");
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const quotaExhausted = !!(user && quota.remaining <= 0);

  return (
    <div className="min-h-screen">
      {/* === Hero Section === */}
      <section className="relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute top-40 right-10 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: "1s" }} />
          <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl animate-float" style={{ animationDelay: "2s" }} />
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 pt-16 pb-12 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/50 border border-purple-200/50 dark:border-purple-800/50 text-sm font-medium text-purple-600 dark:text-purple-400 mb-8 animate-fade-in">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500" />
            </span>
            Powered by DeepSeek AI
          </div>

          {/* Main heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6 animate-slide-up">
            One Article,{" "}
            <span className="gradient-text">Every Platform</span>
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto mb-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Paste your blog post or article. AI instantly rewrites it for 6 platforms —
            with the perfect tone, style, and format for each one.
          </p>

          {/* Platform icons strip */}
          <div className="flex items-center justify-center gap-3 flex-wrap mb-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            {platforms.map((p) => (
              <span
                key={p.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/50 text-sm shadow-sm"
              >
                <span>{p.icon}</span>
                <span className="text-zinc-600 dark:text-zinc-400">{p.name}</span>
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* === Main Content === */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6 pb-20">
        {/* Input Card */}
        <div className="glass rounded-2xl p-6 shadow-xl shadow-purple-500/5 mb-6">
          {/* Textarea */}
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setError("");
            }}
            placeholder="Paste your article, blog post, or any text here..."
            className="w-full h-44 p-4 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-700/60 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-transparent transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            disabled={loading}
          />

          {/* Platform selector + info row */}
          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <div className="flex flex-wrap gap-2">
              {platforms.map((p) => {
                const selected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    disabled={loading}
                    className={`group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                      selected
                        ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 shadow-md scale-105"
                        : "bg-white/60 dark:bg-zinc-800/60 text-zinc-500 dark:text-zinc-400 border border-zinc-200/60 dark:border-zinc-700/60 hover:border-zinc-400 dark:hover:border-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                    } disabled:opacity-50`}
                  >
                    <span className="text-base">{p.icon}</span>
                    <span className="hidden sm:inline">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-zinc-400 font-mono">
              {inputText.length.toLocaleString()} chars
            </span>
          </div>
        </div>

        {/* Generate Button + Quota */}
        <div className="text-center mb-10">
          {/* Quota display */}
          {user && (
            <div className="mb-4 animate-fade-in">
              <div className="inline-flex items-center gap-3">
                <span
                  className={`text-xs font-medium px-3 py-1.5 rounded-full ${
                    quotaExhausted
                      ? "bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50"
                      : quota.remaining <= 1
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50"
                        : "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50"
                  }`}
                >
                  {quotaExhausted
                    ? "Daily limit reached"
                    : quota.remaining <= 1
                      ? `${quota.remaining} left today`
                      : `${quota.remaining} free generations left`}
                </span>
                <span className="text-xs text-zinc-400">
                  {quota.used} / {quota.max_per_day}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={loading || !inputText.trim() || quotaExhausted}
            className="group relative px-10 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 text-white font-semibold text-base shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/40 disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden"
          >
            {/* Shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              {loading ? (
                <>
                  <Spinner />
                  Generating...
                </>
              ) : quotaExhausted ? (
                "Daily Limit Reached"
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Generate Posts
                </>
              )}
            </span>
          </button>

          {/* CTA for non-signed-in */}
          {!user && !userLoading && (
            <p className="text-sm text-zinc-400 mt-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
              <a href="/sign-up" className="text-purple-500 hover:text-purple-600 font-medium underline underline-offset-2">
                Sign up
              </a>{" "}
              to get 3 free generations per day.
            </p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/50 text-red-700 dark:text-red-300 text-sm animate-slide-up">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Results */}
        <div ref={resultsRef}>
          {results.length > 0 && (
            <section className="animate-slide-up">
              {/* Results header */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold">Generated Posts</h2>
                <button
                  onClick={handleCopyAll}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  {copiedAll ? (
                    <>
                      <CheckIcon />
                      Copied All!
                    </>
                  ) : (
                    <>
                      <CopyIcon />
                      Copy All
                    </>
                  )}
                </button>
              </div>

              {/* Results grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((r, idx) => (
                  <div
                    key={r.platform.id}
                    className="group rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 overflow-hidden hover:shadow-lg hover:shadow-purple-500/5 transition-all duration-300 animate-scale-in"
                    style={{ animationDelay: `${idx * 0.1}s` }}
                  >
                    {/* Card header */}
                    <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-zinc-50 to-white dark:from-zinc-800/50 dark:to-zinc-900 border-b border-zinc-100 dark:border-zinc-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{r.platform.icon}</span>
                        <span className="font-medium text-sm">{r.platform.name}</span>
                      </div>
                      {r.error ? (
                        <span className="text-xs text-red-500 font-medium">Failed</span>
                      ) : (
                        <button
                          onClick={() => handleCopy(r.content, r.platform.id)}
                          className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-all ${
                            copiedId === r.platform.id
                              ? "bg-emerald-500 text-white"
                              : "border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                          }`}
                        >
                          {copiedId === r.platform.id ? (
                            <>
                              <CheckIcon />
                              Copied
                            </>
                          ) : (
                            <>
                              <CopyIcon />
                              Copy
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    {/* Card body */}
                    <div className="p-4">
                      {r.error ? (
                        <p className="text-sm text-red-500">{r.error}</p>
                      ) : (
                        <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-zinc-700 dark:text-zinc-300 max-h-80 overflow-y-auto">
                          {r.content}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Empty state */}
        {!loading && results.length === 0 && !error && (
          <div className="text-center py-20 text-zinc-400 dark:text-zinc-500 animate-fade-in">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-1">Ready to transform your content</h3>
            <p className="text-sm">Paste your content above, select platforms, and click Generate.</p>
          </div>
        )}

        {/* === Recent Generations === */}
        {user && history.length > 0 && (
          <section className="mt-16 mb-4">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Recent Generations</h2>
              <a
                href="/schedule"
                className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                View all
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </a>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.slice(0, 6).map((post) => (
                <div
                  key={post.id}
                  className="group p-4 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-purple-500/5 transition-all cursor-pointer"
                  onClick={() => {
                    setInputText(post.source_text);
                    setSelectedPlatforms(post.platforms);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    showToast("Content restored! Click Generate to recreate.", "info");
                  }}
                >
                  <div className="flex items-center gap-1.5 mb-2 flex-wrap">
                    {post.platforms.map((pid) => {
                      const p = platforms.find((pl) => pl.id === pid);
                      return p ? (
                        <span key={pid} className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {p.icon} {p.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 mb-2">
                    {post.source_text}
                  </p>
                  <div className="flex items-center justify-between text-xs text-zinc-400">
                    <span>{new Date(post.created_at).toLocaleDateString()}</span>
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-500">
                      Click to restore
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* === Features Section === */}
        <section className="mt-24 mb-10">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-3">Why BlogToSocial?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              Stop copy-pasting and manually rewriting. Let AI handle the heavy lifting.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: "🎯",
                title: "AI-Native",
                desc: "Not templates. AI reads your content and writes platform-specific posts that actually make sense.",
              },
              {
                icon: "⚡",
                title: "6 Platforms, 1 Click",
                desc: "Twitter, LinkedIn, Reddit, WeChat, Xiaohongshu, Facebook — all from one paste.",
              },
              {
                icon: "💰",
                title: "Save 2 Hours/Day",
                desc: "Stop manually rewriting for each platform. Let AI do the heavy lifting while you focus on creating.",
              },
            ].map((feat, i) => (
              <div
                key={feat.title}
                className="group p-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-purple-500/5 hover:border-purple-200 dark:hover:border-purple-800/50 transition-all duration-300"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="text-2xl mb-3">{feat.icon}</div>
                <h3 className="font-semibold mb-2 text-sm">{feat.title}</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  {feat.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* === Footer === */}
        <footer className="border-t border-zinc-200/60 dark:border-zinc-800/60 py-8 mt-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                B
              </div>
              <span className="text-sm font-semibold">BlogToSocial</span>
            </div>
            <p className="text-xs text-zinc-400">
              Built with Next.js + DeepSeek AI &middot; Free during beta
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
