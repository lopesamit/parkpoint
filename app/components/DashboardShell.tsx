"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, LogOut } from "lucide-react";
import Logo from "./Logo";
import Map from "./Map";

interface DashboardShellProps {
  user: { name: string; email: string };
  apiKey: string;
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");
}

export default function DashboardShell({ user, apiKey }: DashboardShellProps) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      router.push("/");
      router.refresh();
    }
  };

  return (
    <div className="flex h-dvh flex-col bg-ink-100 dark:bg-ink-950">
      <header className="z-20 border-b border-ink-200/70 bg-white/90 backdrop-blur-xl dark:border-ink-800 dark:bg-ink-900/90">
        <div className="flex h-16 items-center justify-between px-4 sm:px-6">
          <Logo href="/dashboard" />

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-sm font-bold text-brand-700 dark:text-brand-400">
                {initialsOf(user.name)}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold leading-tight text-ink-900 dark:text-white">
                  {user.name}
                </p>
                <p className="text-xs leading-tight text-ink-500 dark:text-ink-400">
                  {user.email}
                </p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="inline-flex items-center gap-2 rounded-xl border border-ink-200 px-3.5 py-2 text-sm font-semibold text-ink-600 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:border-ink-700 dark:text-ink-300 dark:hover:border-red-800 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              {isLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        {apiKey ? (
          <Map apiKey={apiKey} />
        ) : (
          <div className="flex h-full items-center justify-center p-6">
            <div className="card-surface max-w-md p-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h2 className="mt-4 font-display text-lg font-semibold text-ink-900 dark:text-white">
                Maps unavailable
              </h2>
              <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
                The Google Maps API key is not configured. Set{" "}
                <code className="rounded bg-ink-100 px-1.5 py-0.5 text-xs dark:bg-ink-800">
                  NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
                </code>{" "}
                in your environment and restart the server.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
