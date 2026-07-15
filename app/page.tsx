import Link from "next/link";
import {
  MapPin,
  Search,
  Navigation,
  Clock,
  Users,
  ShieldCheck,
  ArrowRight,
  BadgeCheck,
} from "lucide-react";
import Logo from "./components/Logo";

const steps = [
  {
    icon: MapPin,
    title: "Report a spot",
    description:
      "Walking past open street parking? Drop a pin in seconds — address and spot count, done.",
  },
  {
    icon: Search,
    title: "Find parking",
    description:
      "Search any address and see every spot the community reported within the last hour, sorted by freshness.",
  },
  {
    icon: Navigation,
    title: "Drive straight there",
    description:
      "One tap opens turn-by-turn directions in Google Maps. No circling the block.",
  },
];

const features = [
  {
    icon: Clock,
    title: "Fresh within the hour",
    description:
      "Stale reports are useless. ParkPoint only shows spots reported in the last 60 minutes, so what you see is what's actually there.",
  },
  {
    icon: Users,
    title: "Powered by neighbors",
    description:
      "Every report comes from a real person on your street. The more people report, the better it works for everyone.",
  },
  {
    icon: ShieldCheck,
    title: "Private by default",
    description:
      "Your location is only used to find spots near you. No tracking, no ads, no selling your data.",
  },
];

export default function Home() {
  return (
    <div className="bg-ink-950 text-white">
      {/* ── Navigation ─────────────────────────────────────────── */}
      <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-ink-950/70 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo onDark />
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="rounded-xl px-4 py-2 text-sm font-semibold text-ink-300 transition-colors hover:text-white"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-ink-950 transition-all hover:bg-brand-400 hover:shadow-glow"
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </nav>
      </header>

      {/* ── Hero ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-16">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(800px 500px at 70% 10%, rgba(16,185,129,0.18), transparent 60%), radial-gradient(600px 400px at 15% 80%, rgba(16,185,129,0.08), transparent 60%)",
          }}
        />
        {/* Street grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-16 px-4 pb-24 pt-20 sm:px-6 lg:grid-cols-2 lg:items-center lg:pt-28">
          <div>
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-3.5 py-1.5 text-xs font-semibold text-brand-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-brand-400" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-400" />
              </span>
              Live community reports, refreshed hourly
            </div>

            <h1
              className="animate-fade-up mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl"
              style={{ animationDelay: "80ms" }}
            >
              Street parking,
              <br />
              <span className="bg-gradient-to-r from-brand-400 to-brand-200 bg-clip-text text-transparent">
                found in seconds.
              </span>
            </h1>

            <p
              className="animate-fade-up mt-6 max-w-md text-lg leading-relaxed text-ink-400"
              style={{ animationDelay: "160ms" }}
            >
              ParkPoint is a community of drivers reporting open spots as they
              see them. Search any address and only see parking reported in the
              last hour — then drive straight to it.
            </p>

            <div
              className="animate-fade-up mt-10 flex flex-wrap items-center gap-4"
              style={{ animationDelay: "240ms" }}
            >
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-semibold text-ink-950 transition-all hover:bg-brand-400 hover:shadow-glow"
              >
                Find parking now
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link href="/login" className="btn-ghost-dark px-6 py-3.5 text-base">
                Sign in
              </Link>
            </div>

            <div
              className="animate-fade-up mt-10 flex items-center gap-2 text-sm text-ink-500"
              style={{ animationDelay: "320ms" }}
            >
              <BadgeCheck className="h-4 w-4 text-brand-500" />
              Free forever. No credit card, no parking meters harmed.
            </div>
          </div>

          {/* Hero visual: stylized street with a live spot card */}
          <div
            className="animate-fade-up relative mx-auto w-full max-w-md lg:max-w-none"
            style={{ animationDelay: "200ms" }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-ink-900/80 p-6 shadow-float backdrop-blur">
              {/* Road */}
              <div className="relative h-64 overflow-hidden rounded-2xl bg-ink-800">
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 animate-road-dash"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(90deg, rgba(250,204,21,0.9) 0 32px, transparent 32px 64px)",
                  }}
                />
                {/* Parked cars */}
                <div className="absolute left-6 top-6 h-10 w-20 rounded-lg bg-ink-700" />
                <div className="absolute left-32 top-6 h-10 w-20 rounded-lg bg-ink-700" />
                {/* Open spot */}
                <div className="absolute left-[232px] top-5 flex h-12 w-24 items-center justify-center rounded-lg border-2 border-dashed border-brand-400/80 bg-brand-500/10">
                  <span className="font-display text-lg font-bold text-brand-400">
                    P
                  </span>
                </div>
                <div className="absolute bottom-6 left-14 h-10 w-20 rounded-lg bg-ink-700" />
                <div className="absolute bottom-6 left-44 h-10 w-20 rounded-lg bg-ink-700" />
                {/* Pin above the open spot */}
                <div className="absolute left-[262px] top-[-2px] animate-float-slow">
                  <MapPin className="h-8 w-8 fill-brand-500 text-ink-950" />
                </div>
              </div>

              {/* Spot card */}
              <div className="mt-5 rounded-2xl border border-white/10 bg-ink-950/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      2 spots · Washington St
                    </p>
                    <p className="mt-0.5 text-xs text-ink-500">
                      0.2 miles away
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-1 text-xs font-semibold text-brand-300">
                    <Clock className="h-3 w-3" />
                    4 min ago
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-500 py-2.5 text-sm font-semibold text-ink-950">
                  <Navigation className="h-4 w-4" />
                  Get directions
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────────── */}
      <section className="relative border-t border-white/5 bg-ink-900/40 py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
              How it works
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Everyone reports. Everyone parks.
            </h2>
            <p className="mt-4 text-lg text-ink-400">
              A community-driven loop that keeps the map fresh — spots expire
              after an hour so you never chase ghosts.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {steps.map((step, i) => (
              <div
                key={step.title}
                className="group relative rounded-2xl border border-white/10 bg-ink-900/60 p-8 transition-all duration-300 hover:-translate-y-1 hover:border-brand-500/40 hover:shadow-glow"
              >
                <span className="absolute right-6 top-6 font-display text-5xl font-bold text-white/5 transition-colors group-hover:text-brand-500/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400 transition-colors group-hover:bg-brand-500 group-hover:text-ink-950">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-6 font-display text-xl font-semibold">
                  {step.title}
                </h3>
                <p className="mt-3 leading-relaxed text-ink-400">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────── */}
      <section className="py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid items-center gap-16 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-brand-400">
                Why ParkPoint
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
                Built for the last block of every drive
              </h2>
              <p className="mt-4 text-lg leading-relaxed text-ink-400">
                The average driver spends 17 hours a year hunting for parking.
                ParkPoint turns that search into a single tap by putting your
                neighbors&apos; eyes to work.
              </p>
              <Link
                href="/signup"
                className="mt-8 inline-flex items-center gap-2 text-base font-semibold text-brand-400 transition-colors hover:text-brand-300"
              >
                Join the community
                <ArrowRight className="h-5 w-5" />
              </Link>
            </div>

            <div className="space-y-4">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex gap-5 rounded-2xl border border-white/10 bg-ink-900/60 p-6 transition-colors hover:border-brand-500/40"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500/15 text-brand-400">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">
                      {feature.title}
                    </h3>
                    <p className="mt-1.5 leading-relaxed text-ink-400">
                      {feature.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden border-t border-white/5 py-24">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 100%, rgba(16,185,129,0.15), transparent 70%)",
          }}
        />
        <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
            Stop circling.
            <br />
            <span className="text-brand-400">Start parking.</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-ink-400">
            Create a free account and see what your neighborhood has reported
            in the last hour.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-8 py-4 text-base font-semibold text-ink-950 transition-all hover:bg-brand-400 hover:shadow-glow"
            >
              Create free account
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────── */}
      <footer className="border-t border-white/5 py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
          <Logo onDark />
          <p className="text-sm text-ink-500">
            © {new Date().getFullYear()} ParkPoint. Made by drivers, for
            drivers.
          </p>
          <div className="flex items-center gap-6 text-sm text-ink-400">
            <Link href="/login" className="transition-colors hover:text-white">
              Sign in
            </Link>
            <Link href="/signup" className="transition-colors hover:text-white">
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
