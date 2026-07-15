import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Reverse geocoding fallback via OpenStreetMap Nominatim, used when the
 * Google Geocoding API is unavailable (e.g. billing not enabled).
 * Proxied server-side to comply with Nominatim's usage policy
 * (identifying User-Agent) and to keep a consistent auth boundary.
 */
export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      Math.abs(lat) > 90 ||
      Math.abs(lng) > 180
    ) {
      return NextResponse.json(
        { message: "Valid coordinates are required" },
        { status: 400 }
      );
    }

    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&addressdetails=1`,
      {
        headers: { "User-Agent": "ParkPoint/1.0 (community parking app)" },
        // Addresses for fixed coordinates rarely change; cache aggressively
        next: { revalidate: 86400 },
      }
    );

    if (!response.ok) {
      throw new Error(`Nominatim responded with ${response.status}`);
    }

    const data = await response.json();
    const a = data?.address ?? {};

    const compact = [
      [a.house_number, a.road].filter(Boolean).join(" "),
      a.city || a.town || a.village || a.hamlet,
      a.state,
      a.postcode,
    ]
      .filter(Boolean)
      .join(", ");

    const address = compact || data?.display_name || "";

    if (!address) {
      return NextResponse.json(
        { message: "No address found for these coordinates" },
        { status: 404 }
      );
    }

    return NextResponse.json({ address });
  } catch (error) {
    console.error("Reverse geocode fallback error:", error);
    return NextResponse.json(
      { message: "Reverse geocoding failed" },
      { status: 502 }
    );
  }
}
