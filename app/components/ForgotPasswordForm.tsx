"use client";

import { useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      setIsSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 dark:text-brand-400">
          <MailCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-6 font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
          Check your email
        </h1>
        <p className="mt-3 text-ink-500 dark:text-ink-400">
          If an account exists for{" "}
          <span className="font-semibold text-ink-700 dark:text-ink-200">
            {email}
          </span>
          , we&apos;ve sent a link to reset your password. The link expires in
          1 hour.
        </p>
        <p className="mt-3 text-sm text-ink-400 dark:text-ink-500">
          Didn&apos;t get it? Check your spam folder, or try again with the
          email you signed up with.
        </p>
        <Link
          href="/login"
          className="btn-primary mt-8 w-full"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-ink-900 dark:text-white">
        Forgot your password?
      </h1>
      <p className="mt-2 text-ink-500 dark:text-ink-400">
        Enter your email and we&apos;ll send you a link to reset it.
      </p>

      <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300"
          >
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input-field"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <button type="submit" disabled={isLoading} className="btn-primary w-full">
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sending link…
            </>
          ) : (
            "Send reset link"
          )}
        </button>
      </form>

      <Link
        href="/login"
        className="mt-8 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-ink-500 transition-colors hover:text-ink-900 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to sign in
      </Link>
    </div>
  );
}
