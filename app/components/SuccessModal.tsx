"use client";

import { Check } from "lucide-react";

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  message: string;
}

export default function SuccessModal({
  isOpen,
  onClose,
  title = "Success!",
  message,
}: SuccessModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm animate-scale-in rounded-2xl bg-white p-8 text-center shadow-float dark:bg-ink-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative mx-auto h-16 w-16">
          <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-500/40" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-brand-500 text-ink-950">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
        </div>
        <h3 className="mt-5 font-display text-xl font-bold text-ink-900 dark:text-white">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-500 dark:text-ink-400">
          {message}
        </p>
        <button onClick={onClose} className="btn-primary mt-6 w-full">
          Done
        </button>
      </div>
    </div>
  );
}
