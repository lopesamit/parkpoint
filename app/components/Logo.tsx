import Link from "next/link";

interface LogoProps {
  href?: string;
  /** Use light text for dark backgrounds */
  onDark?: boolean;
  className?: string;
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} aria-hidden>
      <rect width="64" height="64" rx="16" className="fill-ink-950 dark:fill-brand-950" />
      <path
        d="M32 10c-9.4 0-17 7.4-17 16.6 0 11.4 13.9 24.5 15.5 26 .8.8 2.1.8 2.9 0C35.1 51.1 49 38 49 26.6 49 17.4 41.4 10 32 10z"
        className="fill-brand-500"
      />
      <path
        d="M26 20h7.5c4.1 0 7 2.6 7 6.4 0 3.8-2.9 6.4-7 6.4H30V38h-4V20zm4 3.4v6h3.2c1.9 0 3.2-1.2 3.2-3s-1.3-3-3.2-3H30z"
        className="fill-ink-950 dark:fill-brand-950"
      />
    </svg>
  );
}

export default function Logo({ href = "/", onDark = false, className = "" }: LogoProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2.5 ${className}`}
      aria-label="ParkPoint home"
    >
      <LogoMark />
      <span
        className={`font-display text-xl font-bold tracking-tight ${
          onDark ? "text-white" : "text-ink-900 dark:text-white"
        }`}
      >
        Park<span className="text-brand-500">Point</span>
      </span>
    </Link>
  );
}
