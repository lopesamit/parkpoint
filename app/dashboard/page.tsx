"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Map from "../components/Map";

interface User {
  name: string;
  email: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  useEffect(() => {
    // Check if user is logged in
    const userData = localStorage.getItem("user");
    if (!userData) {
      router.push("/");
      return;
    }

    setUser(JSON.parse(userData));
    setIsLoading(false);
  }, [router]);

  const handleLogout = () => {
    // Clear all session data
    localStorage.removeItem("user");
    sessionStorage.clear();

    // Redirect to homepage
    router.push("/");
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-gray-900 dark:text-white">Loading...</div>
      </div>
    );
  }

  // Show error if API key is not configured
  if (!GOOGLE_MAPS_API_KEY) {
    console.error("Google Maps API key is not configured");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-lg text-red-500">
          Error: Google Maps API key is not configured. Please check your
          environment variables.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                ParkPoint
              </h1>
            </div>
            <div className="flex items-center">
              <span className="text-gray-700 dark:text-gray-300 mr-4">
                Welcome, {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <Map apiKey={GOOGLE_MAPS_API_KEY} />
          </div>
        </div>
      </main>
    </div>
  );
}
