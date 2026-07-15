"use client";

import { useState, useEffect, useRef } from "react";
import {
  AlertCircle,
  Crosshair,
  Loader2,
  MapPin,
  Minus,
  Plus,
  X,
} from "lucide-react";
import SuccessModal from "./SuccessModal";

const MAX_SPOTS = 50;

interface ReportParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentLocation: { lat: number; lng: number } | null;
  currentAddress: string;
  onReportSubmit: (data: {
    location: "current" | "other";
    spots: number;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => Promise<void>;
}

const stepLabels = ["Location", "Address", "Spots"];

export default function ReportParkingModal({
  isOpen,
  onClose,
  currentLocation,
  currentAddress,
  onReportSubmit,
}: ReportParkingModalProps) {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<"current" | "other" | null>(null);
  const [spots, setSpots] = useState(1);
  const [address, setAddress] = useState("");
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const addressInputRef = useRef<HTMLInputElement>(null);

  // Reset the flow every time the modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLocation(null);
      setSpots(1);
      setAddress("");
      setSelectedCoordinates(null);
      setError(null);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  // Attach Places autocomplete when the address step for "other" is visible
  useEffect(() => {
    if (!isOpen || step !== 2 || location !== "other") return;
    const input = addressInputRef.current;
    if (!input || typeof google === "undefined" || !google.maps?.places) return;

    const autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: "us" },
      fields: ["geometry", "formatted_address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        setAddress(place.formatted_address || "");
        setSelectedCoordinates({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        });
      }
    });

    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
    };
  }, [isOpen, step, location]);

  const handleLocationSelect = (selected: "current" | "other") => {
    setError(null);
    if (selected === "current" && !currentLocation) {
      setError(
        "We don't have your location yet. Tap the locate button on the map first."
      );
      return;
    }
    setLocation(selected);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location) return;
    if (location === "other" && (!address || !selectedCoordinates)) {
      setError("Please select an address from the suggestions.");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReportSubmit({
        location,
        spots,
        address: location === "current" ? currentAddress : address,
        coordinates:
          location === "current" ? currentLocation! : selectedCoordinates!,
      });
      setShowSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit report");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/60 p-4 backdrop-blur-sm"
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
      >
        <div
          className="w-full max-w-md animate-scale-in rounded-2xl bg-white p-6 shadow-float dark:bg-ink-900"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start justify-between">
            <div>
              <h2
                id="report-modal-title"
                className="font-display text-xl font-bold text-ink-900 dark:text-white"
              >
                Report parking
              </h2>
              <p className="mt-1 text-sm text-ink-500 dark:text-ink-400">
                Help a neighbor park in seconds.
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Step indicator */}
          <div className="mt-5 flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex flex-1 flex-col gap-1.5">
                <div
                  className={`h-1 rounded-full transition-colors ${
                    step > i ? "bg-brand-500" : "bg-ink-200 dark:bg-ink-700"
                  }`}
                />
                <span
                  className={`text-[11px] font-semibold uppercase tracking-wide ${
                    step > i
                      ? "text-brand-600 dark:text-brand-400"
                      : "text-ink-400 dark:text-ink-500"
                  }`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-sm font-medium text-ink-700 dark:text-ink-300">
                  Where are the open spots?
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleLocationSelect("current")}
                    disabled={!currentLocation}
                    className="group flex flex-col items-center gap-2.5 rounded-xl border-2 border-ink-200 p-5 transition-all hover:border-brand-500 hover:bg-brand-500/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-ink-700 dark:hover:border-brand-500"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-ink-950 dark:text-brand-400">
                      <Crosshair className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">
                      Where I am
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleLocationSelect("other")}
                    className="group flex flex-col items-center gap-2.5 rounded-xl border-2 border-ink-200 p-5 transition-all hover:border-brand-500 hover:bg-brand-500/5 dark:border-ink-700 dark:hover:border-brand-500"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-500/15 text-brand-600 transition-colors group-hover:bg-brand-500 group-hover:text-ink-950 dark:text-brand-400">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <span className="text-sm font-semibold text-ink-800 dark:text-ink-200">
                      Somewhere else
                    </span>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                {location === "current" ? (
                  <div className="rounded-xl border border-ink-200 bg-ink-50 p-4 dark:border-ink-700 dark:bg-ink-800/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                      Reporting at
                    </p>
                    <div className="mt-2 flex items-start gap-2.5">
                      <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                      <p className="text-sm font-medium text-ink-800 dark:text-ink-200">
                        {currentAddress || "Resolving your address…"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label
                      htmlFor="report-address"
                      className="mb-1.5 block text-sm font-medium text-ink-700 dark:text-ink-300"
                    >
                      Address of the parking spot
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                      <input
                        ref={addressInputRef}
                        type="text"
                        id="report-address"
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setSelectedCoordinates(null);
                        }}
                        className="input-field pl-10"
                        placeholder="Start typing an address…"
                        autoComplete="off"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-ink-400">
                      Pick an address from the suggestions.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-sm font-semibold text-ink-500 transition-colors hover:text-ink-800 dark:hover:text-ink-200"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    disabled={
                      location === "current"
                        ? !currentAddress
                        : !address || !selectedCoordinates
                    }
                    className="btn-primary px-6 py-2.5"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium text-ink-700 dark:text-ink-300">
                    How many open spots do you see?
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-5">
                    <button
                      type="button"
                      onClick={() => setSpots((n) => Math.max(1, n - 1))}
                      disabled={spots <= 1}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-200 text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 dark:border-ink-700 dark:text-ink-300"
                      aria-label="Fewer spots"
                    >
                      <Minus className="h-5 w-5" />
                    </button>
                    <div className="w-24 text-center">
                      <span className="font-display text-5xl font-bold text-ink-900 dark:text-white">
                        {spots}
                      </span>
                      <p className="mt-1 text-xs font-medium text-ink-400">
                        spot{spots !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSpots((n) => Math.min(MAX_SPOTS, n + 1))}
                      disabled={spots >= MAX_SPOTS}
                      className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink-200 text-ink-600 transition-colors hover:border-brand-500 hover:text-brand-600 disabled:opacity-40 dark:border-ink-700 dark:text-ink-300"
                      aria-label="More spots"
                    >
                      <Plus className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-sm font-semibold text-ink-500 transition-colors hover:text-ink-800 dark:hover:text-ink-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-primary px-6 py-2.5"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting…
                      </>
                    ) : (
                      "Submit report"
                    )}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-400"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
          </form>
        </div>
      </div>

      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        title="Spot reported"
        message="Thanks for helping your neighbors. Your report will be visible to searchers for the next hour."
      />
    </>
  );
}
