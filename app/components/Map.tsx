"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  AlertCircle,
  Clock,
  Crosshair,
  Loader2,
  MapPin,
  Navigation,
  Plus,
  Search,
  X,
} from "lucide-react";
import ReportParkingModal from "./ReportParkingModal";

const defaultCenter = { lat: 40.7128, lng: -74.006 };
const DEFAULT_ZOOM = 17;
const libraries: "places"[] = ["places"];

/** Muted map style so parking pins stand out */
const MAP_STYLE: google.maps.MapTypeStyle[] = [
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "water", stylers: [{ color: "#c9e2f5" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5f1e6" }] },
  { featureType: "landscape", stylers: [{ color: "#f4f4f2" }] },
];

interface MapProps {
  apiKey: string;
}

interface ParkingSpot {
  id: string;
  location: "current" | "other";
  spots: number;
  address: string;
  coordinates: { lat: number; lng: number };
  timestamp: string;
  distance: number;
}

function formatTimeAgo(timestamp: string): string {
  const diffInMinutes = Math.floor(
    (Date.now() - new Date(timestamp).getTime()) / 60000
  );
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  const hours = Math.floor(diffInMinutes / 60);
  return `${hours}h ${diffInMinutes % 60}m ago`;
}

function freshnessClasses(timestamp: string): string {
  const minutes = (Date.now() - new Date(timestamp).getTime()) / 60000;
  if (minutes < 15)
    return "bg-brand-500/15 text-brand-700 dark:text-brand-400";
  if (minutes < 40)
    return "bg-amber-500/15 text-amber-700 dark:text-amber-400";
  return "bg-ink-500/15 text-ink-600 dark:text-ink-400";
}

export default function Map({ apiKey }: MapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);

  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState("");
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  // Where the user is searching (typed address), which can differ from where they are
  const [searchCenter, setSearchCenter] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  const [showSearch, setShowSearch] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const [searchResults, setSearchResults] = useState<ParkingSpot[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedSpotId, setSelectedSpotId] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const onLoad = useCallback((mapInstance: google.maps.Map) => {
    setMap(mapInstance);
    setGeocoder(new google.maps.Geocoder());
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const getAddressFromCoordinates = useCallback(
    async (location: { lat: number; lng: number }): Promise<string> => {
      // Primary: Google Geocoding (best quality, requires billing enabled)
      if (geocoder) {
        try {
          const result = await geocoder.geocode({ location, region: "us" });
          const address = result.results?.[0]?.formatted_address;
          if (address) return address;
        } catch (error) {
          console.warn(
            "Google reverse geocoding unavailable, using fallback:",
            error
          );
        }
      }

      // Fallback: OpenStreetMap Nominatim via our API (no billing required)
      try {
        const response = await fetch(
          `/api/geocode/reverse?lat=${location.lat}&lng=${location.lng}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.address) return data.address;
        }
      } catch (error) {
        console.error("Fallback reverse geocoding failed:", error);
      }

      return "";
    },
    [geocoder]
  );

  const locate = useCallback(() => {
    if (!map) return;
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setCurrentLocation(location);
        map.panTo(location);
        map.setZoom(DEFAULT_ZOOM);
        setIsLocating(false);

        // Fall back to raw coordinates if reverse geocoding is unavailable
        // (e.g. Geocoding API disabled) so flows depending on the address
        // never get stuck waiting.
        const address = await getAddressFromCoordinates(location);
        setCurrentAddress(
          address ||
            `Near ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}`
        );
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationError(
          "Couldn't get your location. Check browser permissions."
        );
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
    );
  }, [map, getAddressFromCoordinates]);

  // Locate the user once the map is ready
  const didAutoLocate = useRef(false);
  useEffect(() => {
    if (isLoaded && map && geocoder && !didAutoLocate.current) {
      didAutoLocate.current = true;
      locate();
    }
  }, [isLoaded, map, geocoder, locate]);

  // Wire up Places autocomplete whenever the search panel is open
  useEffect(() => {
    if (!showSearch || !isLoaded || !searchInputRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(
      searchInputRef.current,
      {
        componentRestrictions: { country: "us" },
        fields: ["geometry", "formatted_address", "name"],
      }
    );

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (place.geometry?.location) {
        const location = {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
        };
        const label = place.formatted_address || place.name || "";
        setSearchCenter({ ...location, label });
        setSearchAddress(label);
        map?.panTo(location);
        map?.setZoom(DEFAULT_ZOOM);
      }
    });

    autocompleteRef.current = autocomplete;
    return () => {
      google.maps.event.clearInstanceListeners(autocomplete);
      autocompleteRef.current = null;
    };
  }, [showSearch, isLoaded, map]);

  const runSearch = async (center: { lat: number; lng: number } | null) => {
    if (!center) {
      setSearchError(
        "Enter an address or use your current location to search."
      );
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSearchMessage(null);

    try {
      const response = await fetch(
        `/api/parking/search?lat=${center.lat}&lng=${center.lng}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Search failed");
      }

      setSearchResults(data.spots);
      setHasSearched(true);
      setSearchMessage(data.message ?? null);

      if (data.spots.length > 0 && map) {
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(center);
        for (const spot of data.spots as ParkingSpot[]) {
          bounds.extend(spot.coordinates);
        }
        map.fitBounds(bounds, 80);
      }
    } catch (err) {
      console.error("Error searching parking spots:", err);
      setSearchError(
        err instanceof Error
          ? err.message
          : "Failed to search for parking spots. Please try again."
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => runSearch(searchCenter ?? currentLocation);

  /** Clears any typed address and searches around the user's position in one tap. */
  const searchNearMe = () => {
    if (!currentLocation) {
      locate();
      setSearchError(
        "Getting your location… tap again once the blue dot appears."
      );
      return;
    }
    setSearchCenter(null);
    setSearchAddress("");
    map?.panTo(currentLocation);
    map?.setZoom(DEFAULT_ZOOM);
    void runSearch(currentLocation);
  };

  const handleReportSubmit = async (data: {
    location: "current" | "other";
    spots: number;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => {
    const response = await fetch("/api/parking/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || "Failed to submit report");
    }
  };

  const openDirections = (spot: ParkingSpot) => {
    setSelectedSpotId(spot.id);
    const destination = `${spot.coordinates.lat},${spot.coordinates.lng}`;
    const origin = currentLocation
      ? `&origin=${currentLocation.lat},${currentLocation.lng}`
      : "";
    window.open(
      `https://www.google.com/maps/dir/?api=1${origin}&destination=${destination}&travelmode=driving`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card-surface max-w-md p-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-4 font-display text-lg font-semibold text-ink-900 dark:text-white">
            Couldn&apos;t load Google Maps
          </h3>
          <p className="mt-2 text-sm text-ink-500 dark:text-ink-400">
            This is usually an invalid API key, key restrictions, or a missing
            API enablement in the Google Cloud Console. Check the browser
            console for details.
          </p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex items-center gap-3 text-ink-500 dark:text-ink-400">
          <Loader2 className="h-5 w-5 animate-spin text-brand-500" />
          <span className="text-sm font-medium">Loading map…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={currentLocation || defaultCenter}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          styles: MAP_STYLE,
          disableDefaultUI: true,
          zoomControl: true,
          zoomControlOptions: {
            position: google.maps.ControlPosition.RIGHT_CENTER,
          },
          clickableIcons: false,
        }}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
            title={currentAddress || "Your location"}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#3b82f6",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
            }}
            zIndex={10}
          />
        )}
        {searchCenter && (
          <Marker position={searchCenter} title={searchCenter.label} />
        )}
        {searchResults.map((spot) => (
          <Marker
            key={spot.id}
            position={spot.coordinates}
            title={`${spot.spots} spot${spot.spots !== 1 ? "s" : ""} · ${spot.address}`}
            label={{
              text: String(spot.spots),
              color: "#022c22",
              fontWeight: "700",
              fontSize: "12px",
            }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: selectedSpotId === spot.id ? 14 : 12,
              fillColor: "#10b981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2.5,
            }}
            onClick={() => setSelectedSpotId(spot.id)}
          />
        ))}
      </GoogleMap>

      {/* Locate button */}
      <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
        <button
          onClick={locate}
          disabled={isLocating}
          className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-ink-700 shadow-float transition-colors hover:bg-ink-50 disabled:opacity-60 dark:bg-ink-900 dark:text-ink-200 dark:hover:bg-ink-800"
          title="Use my location"
          aria-label="Use my location"
        >
          {isLocating ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Crosshair className="h-5 w-5" />
          )}
        </button>
        {locationError && (
          <div className="flex max-w-xs items-start gap-2 rounded-xl bg-white px-3.5 py-2.5 text-xs font-medium text-red-600 shadow-float dark:bg-ink-900 dark:text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {locationError}
          </div>
        )}
      </div>

      {/* Primary actions */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-3">
        <button
          onClick={() => setShowSearch((v) => !v)}
          className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-semibold shadow-float transition-all ${
            showSearch
              ? "bg-ink-900 text-white dark:bg-white dark:text-ink-950"
              : "bg-white text-ink-800 hover:bg-ink-50 dark:bg-ink-900 dark:text-white dark:hover:bg-ink-800"
          }`}
        >
          <Search className="h-4 w-4" />
          Find parking
        </button>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-brand-500 px-5 py-3 text-sm font-semibold text-ink-950 shadow-float transition-all hover:bg-brand-400 hover:shadow-glow"
        >
          <Plus className="h-4 w-4" />
          Report a spot
        </button>
      </div>

      {/* Search panel */}
      {showSearch && (
        <div className="absolute left-4 top-4 z-10 flex max-h-[calc(100%-7rem)] w-[22rem] max-w-[calc(100%-5.5rem)] animate-scale-in flex-col overflow-hidden rounded-2xl bg-white shadow-float dark:bg-ink-900">
          <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 dark:border-ink-800">
            <h2 className="font-display text-base font-semibold text-ink-900 dark:text-white">
              Find parking
            </h2>
            <button
              onClick={() => setShowSearch(false)}
              className="rounded-lg p-1 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-ink-800 dark:hover:text-ink-200"
              aria-label="Close search"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3 px-5 py-4">
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="input-field pl-10"
                placeholder="Search near an address…"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                autoComplete="off"
              />
            </div>

            <p className="text-xs text-ink-500 dark:text-ink-400">
              {searchCenter
                ? `Searching near ${searchCenter.label}`
                : currentLocation
                  ? "Searching near your current location"
                  : "Waiting for your location…"}
            </p>

            <div className="space-y-2">
              <button
                onClick={handleSearch}
                disabled={isSearching || (!searchCenter && !currentLocation)}
                className="btn-primary w-full py-2.5"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Searching…
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4" />
                    Search
                  </>
                )}
              </button>
              <button
                onClick={searchNearMe}
                disabled={isSearching}
                className="btn-secondary w-full py-2.5"
              >
                <Crosshair className="h-4 w-4" />
                Search near my location
              </button>
            </div>

            {searchError && (
              <div className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700 dark:bg-red-950/40 dark:text-red-400">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                {searchError}
              </div>
            )}
          </div>

          {hasSearched && !searchError && (
            <div className="slim-scroll flex-1 overflow-y-auto border-t border-ink-100 dark:border-ink-800">
              {searchResults.length === 0 ? (
                <div className="px-5 py-8 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-ink-100 text-ink-400 dark:bg-ink-800">
                    <Search className="h-5 w-5" />
                  </div>
                  <p className="mt-3 text-sm font-medium text-ink-700 dark:text-ink-200">
                    No spots in the last hour
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                    {searchMessage}
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 px-4 py-4">
                  <p className="px-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {searchResults.length} spot
                    {searchResults.length !== 1 ? "s" : ""} reported in the last
                    hour
                  </p>
                  {searchResults.map((spot) => (
                    <div
                      key={spot.id}
                      className={`rounded-xl border p-3.5 transition-colors ${
                        selectedSpotId === spot.id
                          ? "border-brand-500/60 bg-brand-500/5"
                          : "border-ink-100 hover:border-ink-200 dark:border-ink-800 dark:hover:border-ink-700"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold leading-snug text-ink-900 dark:text-white">
                          {spot.address}
                        </p>
                        <span
                          className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${freshnessClasses(spot.timestamp)}`}
                        >
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(spot.timestamp)}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                        {spot.spots} spot{spot.spots !== 1 ? "s" : ""} ·{" "}
                        {spot.distance < 0.05
                          ? "right here"
                          : `${spot.distance.toFixed(1)} mi away`}
                      </p>
                      <button
                        onClick={() => openDirections(spot)}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 py-2 text-xs font-semibold text-white transition-colors hover:bg-ink-800 dark:bg-white dark:text-ink-950 dark:hover:bg-ink-100"
                      >
                        <Navigation className="h-3.5 w-3.5" />
                        Get directions
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <ReportParkingModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        currentLocation={currentLocation}
        currentAddress={currentAddress}
        onReportSubmit={handleReportSubmit}
      />
    </div>
  );
}
