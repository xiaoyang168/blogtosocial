"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { platforms } from "@/lib/platforms";
import { showToast } from "@/components/Toast";
import type { User } from "@supabase/supabase-js";

interface ScheduledPost {
  id: string;
  content: string;
  platform_id: string;
  status: "draft" | "scheduled" | "published" | "failed";
  scheduled_at: string;
  published_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Draft", color: "text-zinc-500", bg: "bg-zinc-100 dark:bg-zinc-800" },
  scheduled: { label: "Scheduled", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-950/30" },
  published: { label: "Published", color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  failed: { label: "Failed", color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/30" },
};

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isOverdue(scheduledAt: string, status: string) {
  return status === "scheduled" && new Date(scheduledAt).getTime() < Date.now();
}

export default function SchedulePage() {
  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editingPost, setEditingPost] = useState<ScheduledPost | null>(null);

  // Form state
  const [formContent, setFormContent] = useState("");
  const [formPlatform, setFormPlatform] = useState(platforms[0].id);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    try {
      const url = filter === "all" ? "/api/schedule" : `/api/schedule?status=${filter}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
      }
    } catch (err) {
      console.error("Failed to fetch posts:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      if (!user) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (user) fetchPosts();
  }, [user, fetchPosts]);

  // Auto-set date/time to now + 1 hour when opening form
  useEffect(() => {
    if (showForm && !editingPost) {
      const now = new Date();
      now.setHours(now.getHours() + 1);
      const dateStr = now.toISOString().split("T")[0];
      const timeStr = now.toTimeString().slice(0, 5);
      setFormDate(dateStr);
      setFormTime(timeStr);
    }
  }, [showForm, editingPost]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formContent.trim() || !formDate || !formTime) return;

    const scheduledAt = new Date(`${formDate}T${formTime}`);
    if (scheduledAt.getTime() < Date.now() - 60000) {
      showToast("Scheduled time cannot be in the past", "error");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        content: formContent.trim(),
        platform_id: formPlatform,
        scheduled_at: scheduledAt.toISOString(),
      };

      const res = editingPost
        ? await fetch(`/api/schedule/${editingPost.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/schedule", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to save");
      }

      showToast(editingPost ? "Post updated!" : "Post scheduled!", "success");
      setShowForm(false);
      setEditingPost(null);
      setFormContent("");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || "Failed to save", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (post: ScheduledPost) => {
    setEditingPost(post);
    setFormContent(post.content);
    setFormPlatform(post.platform_id);
    const d = new Date(post.scheduled_at);
    setFormDate(d.toISOString().split("T")[0]);
    setFormTime(d.toTimeString().slice(0, 5));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this scheduled post?")) return;
    try {
      const res = await fetch(`/api/schedule/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      showToast("Post deleted", "success");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || "Failed to delete", "error");
    }
  };

  const handlePublishNow = async (id: string) => {
    try {
      // First update to scheduled time = now, then call publish
      const res = await fetch(`/api/schedule/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scheduled_at: new Date().toISOString() }),
      });
      if (!res.ok) throw new Error("Failed to update");

      const publishRes = await fetch("/api/schedule/publish", { method: "POST" });
      if (!publishRes.ok) throw new Error("Failed to publish");

      showToast("Post published!", "success");
      fetchPosts();
    } catch (err: any) {
      showToast(err.message || "Failed to publish", "error");
    }
  };

  const filteredPosts = posts;

  if (!user && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Sign in to Schedule Posts</h1>
          <p className="text-zinc-500 mb-4">Plan and auto-publish your social media content.</p>
          <a
            href="/sign-in?redirect=/schedule"
            className="inline-flex px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium hover:shadow-lg hover:shadow-purple-500/25 transition-all"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden pt-16 pb-8">
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-1/4 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-40 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="gradient-text">Content Scheduler</span>
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1 text-sm">
                Plan and auto-publish your social media posts across all platforms.
              </p>
            </div>
            <button
              onClick={() => {
                setEditingPost(null);
                setFormContent("");
                setShowForm(!showForm);
              }}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-purple-500/25 transition-all flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              {showForm ? "Cancel" : "New Schedule"}
            </button>
          </div>

          {/* Filter tabs */}
          <div className="mt-6 flex gap-2 flex-wrap">
            {[
              { key: "all", label: "All", count: posts.length },
              { key: "scheduled", label: "Scheduled", count: posts.filter((p) => p.status === "scheduled").length },
              { key: "published", label: "Published", count: posts.filter((p) => p.status === "published").length },
              { key: "draft", label: "Draft", count: posts.filter((p) => p.status === "draft").length },
              { key: "failed", label: "Failed", count: posts.filter((p) => p.status === "failed").length },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  filter === tab.key
                    ? "bg-purple-100 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-20">
        {/* New/Edit Form */}
        {showForm && (
          <div className="glass rounded-2xl p-6 mb-8 animate-slide-up">
            <h2 className="text-lg font-semibold mb-4">
              {editingPost ? "Edit Scheduled Post" : "Schedule New Post"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Platform</label>
                <div className="flex flex-wrap gap-2">
                  {platforms.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setFormPlatform(p.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                        formPlatform === p.id
                          ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                          : "border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      }`}
                    >
                      <span>{p.icon}</span>
                      <span>{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Content</label>
                <textarea
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  placeholder="Write your post content here..."
                  className="w-full h-32 p-3 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-700/60 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-purple-500/40 placeholder:text-zinc-400"
                  required
                />
                <div className="text-xs text-zinc-400 mt-1 text-right">
                  {formContent.length} chars
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-700/60 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Time</label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/60 dark:border-zinc-700/60 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/40"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 text-white font-medium text-sm hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all"
                >
                  {submitting ? "Saving..." : editingPost ? "Update" : "Schedule Post"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingPost(null);
                  }}
                  className="px-6 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="text-center py-20">
            <div className="w-8 h-8 border-2 border-purple-200 border-t-purple-500 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-zinc-400">Loading scheduled posts...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-zinc-400 dark:text-zinc-500">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-950/30 dark:to-pink-950/30 flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM14.25 15h.008v.008H14.25V15zm0 2.25h.008v.008H14.25v-.008z" />
              </svg>
            </div>
            <h3 className="text-base font-medium text-zinc-500 dark:text-zinc-400 mb-1">No posts yet</h3>
            <p className="text-sm">Click "New Schedule" to create your first scheduled post.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const platform = platforms.find((p) => p.id === post.platform_id);
              const status = statusConfig[post.status];
              const overdue = isOverdue(post.scheduled_at, post.status);

              return (
                <div
                  key={post.id}
                  className={`group rounded-2xl border p-4 transition-all hover:shadow-lg ${
                    overdue
                      ? "border-red-200 dark:border-red-800/50 bg-red-50/30 dark:bg-red-950/10"
                      : "border-zinc-200/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Header row */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-base">{platform?.icon}</span>
                        <span className="text-sm font-medium">{platform?.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.bg} ${status.color}`}>
                          {status.label}
                        </span>
                        {overdue && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-600 font-medium">
                            Overdue
                          </span>
                        )}
                      </div>

                      {/* Content preview */}
                      <p className="text-sm text-zinc-600 dark:text-zinc-300 line-clamp-3 mb-2">
                        {post.content}
                      </p>

                      {/* Meta row */}
                      <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {formatDateTime(post.scheduled_at)}
                        </span>
                        {post.published_at && (
                          <span className="flex items-center gap-1">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                            Published {formatDateTime(post.published_at)}
                          </span>
                        )}
                        {post.error_message && (
                          <span className="text-red-500">{post.error_message}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {post.status === "scheduled" && (
                        <button
                          onClick={() => handlePublishNow(post.id)}
                          title="Publish now"
                          className="p-2 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-emerald-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                          </svg>
                        </button>
                      )}
                      {post.status !== "published" && (
                        <button
                          onClick={() => handleEdit(post)}
                          title="Edit"
                          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(post.id)}
                        title="Delete"
                        className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
