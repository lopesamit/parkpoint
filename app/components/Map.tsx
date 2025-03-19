"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import ReportParkingModal from "./ReportParkingModal";

// Add styles for the custom marker
const pulsingDotStyles = `
  @keyframes pulsate {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  .current-location-dot {
    width: 16px;
    height: 16px;
    background-color: #4285f4;
    border-radius: 50%;
    border: 2px solid white;
    box-shadow: 0 0 4px rgba(0,0,0,0.3);
    animation: pulsate 2s ease-in-out infinite;
  }
  .current-location-dot::after {
    content: '';
    position: absolute;
    width: 32px;
    height: 32px;
    background: rgba(66, 133, 244, 0.2);
    border-radius: 50%;
    left: -8px;
    top: -8px;
    z-index: -1;
  }
`;

const containerStyle = {
  width: "100%",
  height: "500px",
};

const defaultCenter = {
  lat: 40.7128, // New York City coordinates as a more central default
  lng: -74.006,
};

// Add default zoom level
const DEFAULT_ZOOM = 18;

// Define libraries array as a static constant
const libraries: ("marker" | "places")[] = ["marker", "places"];

interface MapProps {
  apiKey: string;
  onLocationUpdate?: (
    address: string,
    location: { lat: number; lng: number }
  ) => void;
}

interface ParkingSpot {
  id: string;
  location: "current" | "other";
  spots: number;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
  distance: number;
}

// Add helper functions before the Map component
const formatTimeAgo = (timestamp: string) => {
  const reportedTime = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - reportedTime.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) {
    return "Just now";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;
  } else {
    const hours = Math.floor(diffInMinutes / 60);
    const minutes = diffInMinutes % 60;
    if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
    }
    return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} minute${
      minutes !== 1 ? "s" : ""
    } ago`;
  }
};

const kmToMiles = (km: number) => {
  return (km * 0.621371).toFixed(1);
};

export default function Map({ apiKey, onLocationUpdate }: MapProps) {
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [currentAddress, setCurrentAddress] = useState<string>("");
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchAddress, setSearchAddress] = useState("");
  const searchRef = useRef<HTMLDivElement>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
  const [searchResults, setSearchResults] = useState<ParkingSpot[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);
  const [searchPlace, setSearchPlace] =
    useState<google.maps.places.PlaceResult | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedSpot, setSelectedSpot] = useState<ParkingSpot | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [directionsService, setDirectionsService] =
    useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] =
    useState<google.maps.DirectionsRenderer | null>(null);

  // Add click outside handler
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const pacContainer = document.querySelector(".pac-container");

      // Don't close if clicking inside the search container or the autocomplete dropdown
      if (
        (searchRef.current && searchRef.current.contains(target)) ||
        (pacContainer && pacContainer.contains(target))
      ) {
        return;
      }

      setShowSearch(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey,
    libraries,
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
    // Initialize geocoder with the map instance
    const geocoderInstance = new google.maps.Geocoder();
    setGeocoder(geocoderInstance);
  }, []);

  const onUnmount = useCallback(() => {
    if (marker) {
      marker.setMap(null);
    }
    setMarker(null);
    setMap(null);
  }, [marker]);

  const getAddressFromCoordinates = async (location: {
    lat: number;
    lng: number;
  }) => {
    if (!geocoder) {
      console.error("Geocoder not initialized");
      return "Address not available";
    }

    try {
      const result = await geocoder.geocode({
        location: location,
        region: "us", // Add region to improve results
      });

      if (result.results && result.results[0]) {
        // Get the most relevant address components
        const addressComponents = result.results[0].address_components;

        // Extract address components
        const streetNumber = addressComponents.find((component) =>
          component.types.includes("street_number")
        )?.long_name;
        const streetName = addressComponents.find((component) =>
          component.types.includes("route")
        )?.long_name;
        const city = addressComponents.find((component) =>
          component.types.includes("locality")
        )?.long_name;
        const state = addressComponents.find((component) =>
          component.types.includes("administrative_area_level_1")
        )?.short_name;
        const postalCode = addressComponents.find((component) =>
          component.types.includes("postal_code")
        )?.long_name;

        // Construct a more detailed address
        const formattedAddress = [
          streetNumber,
          streetName,
          city,
          state,
          postalCode,
        ]
          .filter(Boolean)
          .join(", ");

        return formattedAddress || result.results[0].formatted_address;
      }
      return "Address not available";
    } catch (error) {
      console.error("Error getting address:", error);
      return "Address not available";
    }
  };

  const getCurrentLocation = () => {
    if (!map || !isLoaded) return;

    setIsLocating(true);
    setLocationError("");

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setCurrentLocation(location);
          map.panTo(location);
          map.setZoom(DEFAULT_ZOOM);

          // Get and set the address
          const address = await getAddressFromCoordinates(location);
          setCurrentAddress(address);
          if (onLocationUpdate) {
            onLocationUpdate(address, location);
          }

          // Create or update the marker
          if (marker) {
            marker.setMap(null);
          }
          const newMarker = new google.maps.Marker({
            position: location,
            map: map,
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4285f4",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
          setMarker(newMarker);
        },
        (error) => {
          console.error("Error getting location:", error);
          setLocationError("Unable to get your location");
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser");
    }
    setIsLocating(false);
  };

  const handleReportSubmit = async (data: {
    location: "current" | "other";
    spots: number;
    address: string;
    coordinates: { lat: number; lng: number };
  }) => {
    try {
      console.log("Sending report to API:", data);

      const response = await fetch("/api/parking/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();
      console.log("API Response:", responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to submit report");
      }
    } catch (err) {
      console.error("Error reporting parking:", err);
      throw err;
    }
  };

  const handleSearch = async () => {
    if (!currentLocation) {
      setSearchError("Please get your current location first");
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await fetch(
        `/api/parking/search?lat=${currentLocation.lat}&lng=${currentLocation.lng}`
      );

      if (!response.ok) {
        throw new Error("Failed to search for parking spots");
      }

      const data = await response.json();
      setSearchResults(data.spots);
    } catch (err) {
      console.error("Error searching parking spots:", err);
      setSearchError("Failed to search for parking spots. Please try again.");
    } finally {
      setIsSearching(false);
    }
  };

  // Update the useEffect for initial location
  useEffect(() => {
    if (isLoaded && map && !currentLocation) {
      // Try to get user's location on initial load
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const location = {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            };
            setCurrentLocation(location);
            map.panTo(location);
            map.setZoom(DEFAULT_ZOOM);

            // Get address from coordinates
            const address = await getAddressFromCoordinates(location);
            setCurrentAddress(address);
            onLocationUpdate?.(address, location);

            // Create marker with address as title
            const newMarker = new google.maps.Marker({
              map,
              position: location,
              title: address || "Location not available",
              animation: google.maps.Animation.DROP,
            });
            setMarker(newMarker);
          },
          (error) => {
            console.error("Error getting initial location:", error);
            // If we can't get location, center on default location
            map.panTo(defaultCenter);
            map.setZoom(DEFAULT_ZOOM);
          }
        );
      } else {
        // If geolocation is not supported, center on default location
        map.panTo(defaultCenter);
        map.setZoom(DEFAULT_ZOOM);
      }
    }
  }, [isLoaded, map, currentLocation, onLocationUpdate]);

  // Add function to handle place selection
  const onPlaceSelected = (place: google.maps.places.PlaceResult) => {
    if (place.geometry && place.geometry.location) {
      const location = {
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
      };
      setCurrentLocation(location);
      map?.panTo(location);
      map?.setZoom(DEFAULT_ZOOM);

      // Update marker
      if (marker) {
        marker.setMap(null);
      }
      const newMarker = new google.maps.Marker({
        map: map!,
        position: location,
        title: place.name || "Selected Location",
        animation: google.maps.Animation.DROP,
      });
      setMarker(newMarker);

      // Set the address
      setCurrentAddress(place.formatted_address || "");
      setSearchAddress(place.formatted_address || "");
    }
  };

  // Add effect to initialize autocomplete
  useEffect(() => {
    if (searchInputRef.current && !autocomplete) {
      const autocompleteInstance = new google.maps.places.Autocomplete(
        searchInputRef.current,
        {
          componentRestrictions: { country: "us" },
          fields: ["geometry", "name", "formatted_address"],
        }
      );

      // Add click event listener to the autocomplete dropdown
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
        if (place) {
          onPlaceSelected(place);
        }
      });

      // Add listener for when the autocomplete dropdown is shown
      google.maps.event.addListener(
        autocompleteInstance,
        "place_changed",
        () => {
          const pacContainer = document.querySelector(
            ".pac-container"
          ) as HTMLElement;
          if (pacContainer) {
            pacContainer.addEventListener("click", (e) => {
              e.stopPropagation();
            });
          }
        }
      );

      setAutocomplete(autocompleteInstance);
    }
  }, [searchInputRef.current, autocomplete]);

  // Initialize directions service and renderer
  useEffect(() => {
    if (isLoaded && map) {
      const service = new google.maps.DirectionsService();
      const renderer = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: {
          strokeColor: "#4F46E5", // Indigo color
          strokeWeight: 4,
        },
      });
      setDirectionsService(service);
      setDirectionsRenderer(renderer);
    }
  }, [isLoaded, map]);

  // Function to get directions
  const getDirections = async (destination: { lat: number; lng: number }) => {
    if (!directionsService || !currentLocation) return;

    try {
      const result = await directionsService.route({
        origin: new google.maps.LatLng(
          currentLocation.lat,
          currentLocation.lng
        ),
        destination: new google.maps.LatLng(destination.lat, destination.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirections(result);
      if (directionsRenderer) {
        directionsRenderer.setMap(map);
        directionsRenderer.setDirections(result);
      }
    } catch (error) {
      console.error("Error getting directions:", error);
    }
  };

  // Function to handle spot selection
  const handleSpotSelect = (spot: ParkingSpot) => {
    setSelectedSpot(spot);

    // Create Google Maps directions URL
    const origin = `${currentLocation?.lat},${currentLocation?.lng}`;
    const destination = `${spot.coordinates.lat},${spot.coordinates.lng}`;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=driving`;

    // Open in new tab
    window.open(mapsUrl, "_blank");
  };

  if (loadError) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-lg">
        <h3 className="font-semibold mb-2">Error Loading Google Maps</h3>
        <p className="text-sm">
          There was an error loading Google Maps. This could be due to:
        </p>
        <ul className="list-disc list-inside text-sm mt-2">
          <li>Invalid API key</li>
          <li>API key restrictions</li>
          <li>Missing enabled APIs in Google Cloud Console</li>
        </ul>
        <p className="text-sm mt-2">
          Please check the JavaScript console for technical details.
        </p>
      </div>
    );
  }

  if (!isLoaded)
    return (
      <div className="flex items-center justify-center h-[500px] bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="flex items-center gap-2">
          <svg
            className="animate-spin h-5 w-5 text-indigo-600"
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
          <span>Loading Google Maps...</span>
        </div>
      </div>
    );

  return (
    <div className="relative w-full h-[600px]">
      <GoogleMap
        mapContainerClassName="w-full h-full rounded-lg"
        center={currentLocation || defaultCenter}
        zoom={DEFAULT_ZOOM}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {currentLocation && (
          <Marker
            position={currentLocation}
            title={currentAddress || "Location not available"}
          />
        )}
        {selectedSpot && (
          <Marker
            position={selectedSpot.coordinates}
            title={selectedSpot.address}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 8,
              fillColor: "#4F46E5",
              fillOpacity: 1,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
            }}
          />
        )}
        {directions && (
          <DirectionsRenderer
            directions={directions}
            options={{
              suppressMarkers: true,
              polylineOptions: {
                strokeColor: "#4F46E5",
                strokeWeight: 4,
              },
            }}
          />
        )}
      </GoogleMap>

      {/* Top button */}
      <div className="absolute top-2 left-2">
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-1.5 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
        >
          {isLocating ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
              Getting Location...
            </>
          ) : (
            <>
              <svg
                className="w-4 h-4"
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
              Use My Location
            </>
          )}
        </button>
      </div>

      {locationError && (
        <div className="absolute top-2 right-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-100 px-3 py-1.5 rounded-lg shadow-md text-sm">
          {locationError}
        </div>
      )}

      {/* Bottom buttons */}
      <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
        <button
          onClick={() => setShowSearch(!showSearch)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          Find Parking
        </button>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white px-4 py-2 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 text-sm"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Report Parking
        </button>
      </div>

      {showSearch && (
        <div
          ref={searchRef}
          className="absolute top-12 left-2 bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg w-72 z-50 max-h-[400px] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-4">
            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Enter Address
              </label>
              <input
                ref={searchInputRef}
                type="text"
                id="address"
                className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                placeholder="Enter an address"
                value={searchAddress}
                onChange={(e) => setSearchAddress(e.target.value)}
                autoComplete="off"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleSearch}
                disabled={isSearching || !currentLocation}
                className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSearching ? "Searching..." : "Search"}
              </button>
              <button
                onClick={getCurrentLocation}
                className="flex-1 bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white px-4 py-2 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
              >
                Use Current Location
              </button>
            </div>

            {searchError && (
              <p className="text-red-600 dark:text-red-400 text-sm">
                {searchError}
              </p>
            )}

            {searchResults.length > 0 && (
              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                  Found {searchResults.length} parking spots nearby
                </h3>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((spot) => (
                    <div
                      key={spot.id}
                      className="p-2 bg-gray-50 dark:bg-gray-700 rounded-md text-sm"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {spot.address}
                      </p>
                      <p className="text-gray-600 dark:text-gray-300">
                        {spot.spots} spot{spot.spots !== 1 ? "s" : ""} available
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        {kmToMiles(spot.distance)} miles away
                      </p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Last reported {formatTimeAgo(spot.timestamp)}
                      </p>
                      <button
                        onClick={() => handleSpotSelect(spot)}
                        className="mt-2 w-full bg-indigo-600 text-white px-3 py-1.5 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-sm flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 7l5 5m0 0l-5 5m5-5H6"
                          />
                        </svg>
                        Get Directions
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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
