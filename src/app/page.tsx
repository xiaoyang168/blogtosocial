"use client";

import { useState, useCallback } from "react";
import { platforms } from "@/lib/platforms";
import {
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/nextjs";

interface GenerateResult {
  platform: { id: string; name: string; icon: string };
  content: string;
  error?: string;
}

export default function Home() {
  const { isSignedIn } = useAuth();
  const [inputText, setInputText] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    platforms.map((p) => p.id)
  );
  const [results, setResults] = useState<GenerateResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

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
        throw new Error(data.error || "Generation failed");
      }

      setResults(data.results);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [inputText, selectedPlatforms]);

  const handleCopy = async (text: string, platformId: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(platformId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold tracking-tight">BlogToSocial</span>
            <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2 py-0.5 rounded-full font-medium">
              AI
            </span>
          </div>
          <div className="flex items-center gap-3">
            {!isSignedIn ? (
              <>
                <SignInButton mode="modal">
                  <button className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="text-sm font-medium px-3 py-1.5 rounded-lg bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition-opacity">
                    Sign Up
                  </button>
                </SignUpButton>
              </>
            ) : (
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        {/* Hero */}
        <section className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
            One Article → Every Platform
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 max-w-xl mx-auto text-base">
            Paste your blog post, article, or any text. AI instantly rewrites it
            for Twitter, LinkedIn, Reddit, and more — with platform-perfect tone.
          </p>
        </section>

        {/* Input Area */}
        <section className="mb-6">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste your article, blog post, or any text here..."
            className="w-full h-40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow placeholder:text-zinc-400"
            disabled={loading}
          />
          <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
            <div className="flex flex-wrap gap-1.5">
              {platforms.map((p) => {
                const selected = selectedPlatforms.includes(p.id);
                return (
                  <button
                    key={p.id}
                    onClick={() => togglePlatform(p.id)}
                    disabled={loading}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${
                      selected
                        ? "bg-zinc-900 text-white border-zinc-900 dark:bg-white dark:text-zinc-900 dark:border-white"
                        : "bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700 hover:border-zinc-400"
                    } disabled:opacity-50`}
                  >
                    <span>{p.icon}</span>
                    <span className="hidden sm:inline">{p.name}</span>
                  </button>
                );
              })}
            </div>
            <span className="text-xs text-zinc-400">
              {inputText.length} chars
            </span>
          </div>
        </section>

        {/* Generate Button */}
        <div className="text-center mb-10">
          <button
            onClick={handleGenerate}
            disabled={loading || !inputText.trim()}
            className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold text-base shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              "Generate Posts"
            )}
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-8 p-4 rounded-xl bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        {/* Results */}
        {results.length > 0 && (
          <section className="space-y-6">
            <h2 className="text-lg font-semibold">Generated Posts</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {results.map((r) => (
                <div
                  key={r.platform.id}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{r.platform.icon}</span>
                      <span className="font-medium text-sm">
                        {r.platform.name}
                      </span>
                    </div>
                    {r.error ? (
                      <span className="text-xs text-red-500">Failed</span>
                    ) : (
                      <button
                        onClick={() => handleCopy(r.content, r.platform.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors"
                      >
                        {copiedId === r.platform.id ? "Copied!" : "Copy"}
                      </button>
                    )}
                  </div>
                  <div className="p-4">
                    {r.error ? (
                      <p className="text-sm text-red-500">{r.error}</p>
                    ) : (
                      <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {r.content}
                      </pre>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {!loading && results.length === 0 && !error && (
          <div className="text-center py-16 text-zinc-400 dark:text-zinc-500">
            <svg
              className="w-16 h-16 mx-auto mb-4 opacity-50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
              />
            </svg>
            <p className="text-sm">
              Paste your content above, select platforms, and click Generate.
            </p>
          </div>
        )}

        {/* Features */}
        <section className="mt-20 mb-10">
          <h2 className="text-xl font-semibold text-center mb-8">
            Why BlogToSocial?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <div className="text-2xl mb-2">🎯</div>
              <h3 className="font-semibold mb-1 text-sm">AI-Native</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Not templates. AI reads your content and writes posts that make
                sense for each platform.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <div className="text-2xl mb-2">⚡</div>
              <h3 className="font-semibold mb-1 text-sm">5 Platforms, 1 Click</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Twitter, LinkedIn, Reddit, Facebook, Xiaohongshu — all from one
                paste.
              </p>
            </div>
            <div className="p-5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
              <div className="text-2xl mb-2">💰</div>
              <h3 className="font-semibold mb-1 text-sm">Save 2 Hours/Day</h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Stop manually rewriting for each platform. Let AI do the heavy
                lifting.
              </p>
            </div>
          </div>
        </section>

        <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 mt-10 text-center text-xs text-zinc-400">
          <p>Built with Next.js + DeepSeek AI. 100% free during beta.</p>
        </footer>
      </main>
    </div>
  );
}
