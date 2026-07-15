import Link from "next/link";
import { MapPin } from "lucide-react";
import Logo from "./components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink-50 p-6 dark:bg-ink-950">
      <Logo />
      <div className="mt-12 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-500/15 text-brand-600 dark:text-brand-400">
        <MapPin className="h-8 w-8" />
      </div>
      <h1 className="mt-6 font-display text-4xl font-bold tracking-tight text-ink-900 dark:text-white">
        Wrong turn
      </h1>
      <p className="mt-3 max-w-sm text-center text-ink-500 dark:text-ink-400">
        This page doesn&apos;t exist — kind of like that parking spot someone
        swore was open.
      </p>
      <Link href="/" className="btn-primary mt-8">
        Back to ParkPoint
      </Link>
    </div>
  );
}
