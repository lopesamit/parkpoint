"use client";

import { useState, useEffect, useRef } from "react";
import SuccessModal from "./SuccessModal";

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

export default function ReportParkingModal({
  isOpen,
  onClose,
  currentLocation,
  currentAddress,
  onReportSubmit,
}: ReportParkingModalProps) {
  const [step, setStep] = useState(1);
  const [location, setLocation] = useState<"current" | "other" | null>(null);
  const [spots, setSpots] = useState("");
  const [address, setAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [selectedPlace, setSelectedPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const [selectedCoordinates, setSelectedCoordinates] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const addressInputRef = useRef<HTMLInputElement>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setLocation(null);
      setSpots("");
      setAddress("");
      setError(null);
      setIsAddressLoading(false);
    }
  }, [isOpen]);

  // Initialize Google Places Autocomplete
  useEffect(() => {
    if (addressInputRef.current && !autocomplete) {
      // Ensure the Google Maps API is loaded
      if (typeof google !== "undefined" && google.maps && google.maps.places) {
        const autocompleteInstance = new google.maps.places.Autocomplete(
          addressInputRef.current,
          {
            componentRestrictions: { country: "us" },
            fields: ["geometry", "name", "formatted_address"],
          }
        );

        // Add click event listener to prevent modal from closing when selecting an address
        const pacContainer = document.querySelector(
          ".pac-container"
        ) as HTMLElement;
        if (pacContainer) {
          pacContainer.addEventListener("click", (e) => {
            e.stopPropagation();
          });
        }

        autocompleteInstance.addListener("place_changed", () => {
          const place = autocompleteInstance.getPlace();
          if (place.geometry && place.geometry.location) {
            setAddress(place.formatted_address || "");
            setSelectedCoordinates({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            });
          }
        });

        setAutocomplete(autocompleteInstance);
      }
    }

    // Cleanup function
    return () => {
      if (autocomplete) {
        google.maps.event.clearInstanceListeners(autocomplete);
        setAutocomplete(null);
      }
    };
  }, [addressInputRef.current, autocomplete]);

  const handleLocationSelect = (selectedLocation: "current" | "other") => {
    if (selectedLocation === "current") {
      if (!currentLocation) {
        setError(
          "Please get your current location first by clicking 'Use My Location' on the map"
        );
        return;
      }
      if (!currentAddress) {
        setError("Please wait while we fetch your address...");
        setIsAddressLoading(true);
        return;
      }
    }
    setLocation(selectedLocation);
    setStep(2);
  };

  const onPlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      setAddress(place.formatted_address || "");
      setSelectedPlace(place);
      setSelectedCoordinates({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!location) {
      setError("Please select a location type (current or other)");
      return;
    }

    if (location === "current" && !currentLocation) {
      setError(
        "Please get your current location first by clicking 'Use My Location' on the map"
      );
      return;
    }

    if (location === "other" && (!address || !selectedCoordinates)) {
      setError(
        "Please enter and select a valid address for the parking location"
      );
      return;
    }

    if (!spots || parseInt(spots) < 1) {
      setError("Please enter a valid number of spots");
      return;
    }

    setIsSubmitting(true);

    try {
      await onReportSubmit({
        location,
        spots: parseInt(spots),
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
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Report Available Parking
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {step === 1 && (
              <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Where are the parking spots located?
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => handleLocationSelect("current")}
                    disabled={!currentLocation || isAddressLoading}
                    className={`p-4 rounded-lg border-2 ${
                      location === "current"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-500"
                    } ${
                      !currentLocation || isAddressLoading
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      {isAddressLoading ? (
                        <svg
                          className="animate-spin h-6 w-6 text-indigo-500"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-6 h-6 text-indigo-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      )}
                      <span className="text-sm font-medium">
                        {isAddressLoading ? "Loading..." : "Current Location"}
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLocation("other");
                      setStep(2);
                    }}
                    className={`p-4 rounded-lg border-2 ${
                      location === "other"
                        ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-indigo-500"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <svg
                        className="w-6 h-6 text-indigo-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      <span className="text-sm font-medium">
                        Other Location
                      </span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                {location === "current" ? (
                  <>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Confirm Your Location
                      </h3>
                      {isAddressLoading ? (
                        <div className="flex items-center space-x-2">
                          <svg
                            className="animate-spin h-4 w-4 text-indigo-500"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              fill="none"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                          </svg>
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            Loading address...
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {currentAddress}
                        </p>
                      )}
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={isAddressLoading}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Confirm Location
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Enter Address
                      </label>
                      <input
                        ref={addressInputRef}
                        type="text"
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                        placeholder="Enter the address"
                        required
                        autoComplete="off"
                      />
                    </div>
                    <div className="flex justify-between">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        disabled={!address || !selectedCoordinates}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label
                    htmlFor="spots"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Number of Available Spots
                  </label>
                  <input
                    type="number"
                    id="spots"
                    value={spots}
                    onChange={(e) => setSpots(e.target.value)}
                    min="1"
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                <div className="flex justify-between">
                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
            )}
          </form>
        </div>
      </div>
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        message="Parking spot reported successfully!"
      />
    </>
  );
}
