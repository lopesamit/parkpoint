"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8 bg-[var(--background)]">
      <div className="max-w-2xl w-full text-center">
        <h1 className="text-4xl font-bold mb-8 text-[var(--foreground)]">
          Welcome to ParkPoint
        </h1>
        <p className="text-xl mb-8 text-[var(--foreground)]/80">
          Find street parking in seconds
        </p>

        <div className="space-x-4">
          <Link
            href="/login"
            className="inline-block bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="inline-block bg-transparent text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-lg border-2 border-indigo-600 dark:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>

      {/* How it works section */}
      <section className="py-16 bg-gray-50 dark:bg-gray-900 w-full">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
              How ParkPoint Works
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
              A community-driven platform where everyone helps everyone find
              parking
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connecting lines */}
            <div className="hidden md:block absolute top-8 left-1/3 w-1/3 h-0.5 bg-indigo-200 dark:bg-indigo-800 transform -translate-y-1/2">
              <div className="absolute right-0 top-1/2 w-2 h-2 bg-indigo-600 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
            </div>

            {/* Step 1 */}
            <div className="relative group">
              <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4 relative overflow-hidden group-hover:bg-indigo-700 transition-colors duration-300">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  Report Available Spots
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Walking by a street with available parking? Report it
                  instantly with the time and location to help others
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4 relative overflow-hidden group-hover:bg-indigo-700 transition-colors duration-300">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  Find Real-Time Parking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  See recently reported parking spots in your area with
                  timestamps, helping you find available spots quickly
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="flex flex-col items-center text-center transform transition-all duration-300 hover:scale-105">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-indigo-600 text-white mb-4 relative overflow-hidden group-hover:bg-indigo-700 transition-colors duration-300">
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <svg
                    className="w-8 h-8"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">
                  Tip & Support
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Found a spot? Show appreciation by tipping the reporter. Tips
                  help keep the app running and reward helpful community members
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features section */}
    </main>
  );
}
