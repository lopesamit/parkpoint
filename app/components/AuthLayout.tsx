import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Navigation } from "lucide-react";
import Logo from "./Logo";

interface AuthLayoutProps {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="grid min-h-screen bg-ink-50 dark:bg-ink-950 lg:grid-cols-[5fr_4fr]">
      {/* Brand panel */}
      <aside className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(700px 500px at 20% 20%, rgba(16,185,129,0.16), transparent 60%), radial-gradient(500px 400px at 90% 90%, rgba(16,185,129,0.08), transparent 60%)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="relative">
          <Logo onDark />
        </div>

        <div className="relative max-w-md">
          <h2 className="font-display text-4xl font-bold leading-tight tracking-tight">
            The fastest way from{" "}
            <span className="text-brand-400">driving</span> to{" "}
            <span className="text-brand-400">parked</span>.
          </h2>
          <div className="mt-10 space-y-5">
            {[
              { icon: MapPin, text: "Neighbors report open spots as they see them" },
              { icon: Clock, text: "Only spots from the last hour — never stale" },
              { icon: Navigation, text: "One tap to turn-by-turn directions" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-ink-300">{text}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-sm text-ink-500">
          © {new Date().getFullYear()} ParkPoint
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col p-6 sm:p-10">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink-500 transition-colors hover:text-ink-900 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to home
          </Link>
          <span className="lg:hidden">
            <Logo />
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm animate-fade-up">{children}</div>
        </div>
      </main>
    </div>
  );
}
