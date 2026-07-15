import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex h-dvh items-center justify-center bg-ink-100 dark:bg-ink-950">
      <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400">
        <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
        <span className="text-sm font-medium">Loading your dashboard…</span>
      </div>
    </div>
  );
}
