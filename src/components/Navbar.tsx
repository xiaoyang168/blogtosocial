"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.refresh();
  };

  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (isAuthPage) return null;

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 dark:bg-zinc-950/70 border-b border-zinc-200/60 dark:border-zinc-800/60">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-md shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              B
            </div>
            <span className="text-lg font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400">
              BlogToSocial
            </span>
          </a>

          {/* Desktop Nav */}
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="/"
              className={`text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Home
            </a>
            <a
              href="/pricing"
              className={`text-sm font-medium transition-colors ${
                pathname === "/pricing"
                  ? "text-zinc-900 dark:text-white"
                  : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
              }`}
            >
              Pricing
            </a>

            {loading ? (
              <div className="w-20 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ) : user ? (
              <div className="flex items-center gap-3">
                <span className="text-xs px-2.5 py-1 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-medium">
                  PRO
                </span>
                <span className="text-sm text-zinc-600 dark:text-zinc-400 max-w-[140px] truncate">
                  {user.email}
                </span>
                <button
                  onClick={handleSignOut}
                  className="text-sm font-medium text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <a
                  href="/sign-in"
                  className="text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="text-sm font-medium px-4 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:shadow-purple-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <div className="sm:hidden flex items-center gap-2">
            {!loading && user && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-medium">
                PRO
              </span>
            )}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="sm:hidden pb-4 border-t border-zinc-100 dark:border-zinc-800 pt-3 space-y-3">
            <a
              href="/"
              className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === "/"
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              }`}
            >
              Home
            </a>
            {loading ? (
              <div className="w-full h-9 rounded-lg bg-zinc-100 dark:bg-zinc-800 animate-pulse" />
            ) : user ? (
              <>
                <div className="px-3 text-sm text-zinc-500 dark:text-zinc-400 truncate">
                  {user.email}
                </div>
                <button
                  onClick={handleSignOut}
                  className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2 px-3">
                <a
                  href="/sign-in"
                  className="flex-1 text-center text-sm font-medium px-4 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                >
                  Sign In
                </a>
                <a
                  href="/sign-up"
                  className="flex-1 text-center text-sm font-medium px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                >
                  Get Started
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
