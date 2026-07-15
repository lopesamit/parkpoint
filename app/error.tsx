"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 p-6 dark:bg-ink-950">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
        Something went wrong
      </h1>
      <p className="mt-3 max-w-sm text-center text-ink-500 dark:text-ink-400">
        An unexpected error occurred. Try again — if it keeps happening, come
        back in a few minutes.
      </p>
      <button onClick={reset} className="btn-primary mt-8">
        Try again
      </button>
    </div>
  );
}
