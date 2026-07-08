"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { platforms } from "@/lib/platforms";
import { createClient } from "@/lib/supabase/client";
import { showToast } from "@/components/Toast";
import type { User } from "@supabase/supabase-js";

interface HistoryPost {
  id: string;
  source_text: string;
  results: Record<string, any>;
  platforms: string[];
  created_at: string;
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<HistoryPost[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
      if (!user) {
        router.push("/sign-in");
      }
    });
  }, [router]);

  const fetchPosts = useCallback(async () => {
    if (!user || fetching) return;
    try {
      setFetching(true);
      const res = await fetch(`/api/history?limit=${PAGE_SIZE}&offset=${offset}`);
      if (res.ok) {
        const data = await res.json();
        const newPosts = data.posts || [];
        setPosts((prev) => (offset === 0 ? newPosts : [...prev, ...newPosts]));
        setHasMore(newPosts.length === PAGE_SIZE);
      }
    } catch {
      // ignore
    } finally {
      setFetching(false);
    }
  }, [user, offset, fetching]);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user, offset]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this generation?")) return;
    try {
      setDeletingId(id);
      const res = await fetch(`/api/history?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setPosts((prev) => prev.filter((p) => p.id !== id));
        showToast("Deleted", "success");
      } else {
        showToast("Failed to delete", "error");
      }
    } catch {
      showToast("Failed to delete", "error");
    } finally {
      setDeletingId(null);
    }
  };

  const handleRestore = (post: HistoryPost) => {
    // Store in sessionStorage for homepage to pick up
    sessionStorage.setItem("restore_post", JSON.stringify({
      source_text: post.source_text,
      platforms: post.platforms,
    }));
    router.push("/");
  };

  const handleLoadMore = () => {
    if (!fetching && hasMore) {
      setOffset((prev) => prev + PAGE_SIZE);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-6 w-6 border-2 border-purple-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Generation History</h1>
            <p className="text-sm text-zinc-500 mt-1">
              All your AI-generated social posts. Click to restore and regenerate.
            </p>
          </div>
          <a
            href="/"
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Back to Home
          </a>
        </div>

        {/* Posts */}
        {posts.length === 0 && !fetching ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-zinc-500 mb-1">No history yet</h3>
            <p className="text-sm text-zinc-400">Generate your first post to see it here.</p>
            <a
              href="/"
              className="inline-block mt-4 text-sm font-medium px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all"
            >
              Generate Now
            </a>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="group p-5 rounded-2xl border border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
                >
                  {/* Platforms */}
                  <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    {post.platforms.map((pid) => {
                      const p = platforms.find((pl) => pl.id === pid);
                      return p ? (
                        <span
                          key={pid}
                          className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                        >
                          {p.icon} {p.name}
                        </span>
                      ) : null;
                    })}
                  </div>

                  {/* Source text preview */}
                  <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-4 mb-4 leading-relaxed">
                    {post.source_text}
                  </p>

                  {/* Results preview */}
                  <div className="space-y-2 mb-4">
                    {post.platforms.slice(0, 2).map((pid) => {
                      const content = post.results[pid];
                      if (!content) return null;
                      const p = platforms.find((pl) => pl.id === pid);
                      return (
                        <div key={pid} className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 bg-zinc-50 dark:bg-zinc-800/50 p-2 rounded-lg">
                          <span className="font-medium">{p?.name}:</span> {typeof content === "string" ? content : JSON.stringify(content)}
                        </div>
                      );
                    })}
                    {post.platforms.length > 2 && (
                      <div className="text-xs text-zinc-400">
                        +{post.platforms.length - 2} more platforms
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-zinc-100 dark:border-zinc-800">
                    <span className="text-xs text-zinc-400">
                      {new Date(post.created_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRestore(post)}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors"
                      >
                        Restore
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors disabled:opacity-50"
                      >
                        {deletingId === post.id ? (
                          <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-8">
                <button
                  onClick={handleLoadMore}
                  disabled={fetching}
                  className="px-6 py-2.5 rounded-xl text-sm font-medium border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  {fetching ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Loading...
                    </span>
                  ) : (
                    "Load More"
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
