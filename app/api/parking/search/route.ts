import { NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

const RADIUS_MILES = 0.5;
const MAX_RESULTS = 10;
const FRESHNESS_MS = 60 * 60 * 1000; // only spots reported within the last hour
const MILES_PER_DEGREE_LAT = 69;

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "You must be signed in to search for parking" },
        { status: 401 }
      );
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

    const reportedParking = await getCollection("reported_parking");
    const oneHourAgo = new Date(Date.now() - FRESHNESS_MS);

    // Rough bounding box so we never scan the whole collection,
    // then refine with the Haversine distance below.
    const latDelta = RADIUS_MILES / MILES_PER_DEGREE_LAT;
    const lngDelta =
      RADIUS_MILES /
      (MILES_PER_DEGREE_LAT * Math.max(Math.cos(toRad(lat)), 0.01));

    const candidates = await reportedParking
      .find({
        status: "active",
        timestamp: { $gte: oneHourAgo },
        "coordinates.lat": { $gte: lat - latDelta, $lte: lat + latDelta },
        "coordinates.lng": { $gte: lng - lngDelta, $lte: lng + lngDelta },
      })
      .sort({ timestamp: -1 })
      .limit(200)
      .toArray();

    const spots = candidates
      .map((spot) => ({
        id: spot._id.toString(),
        location: spot.location as "current" | "other",
        spots: spot.spots as number,
        address: spot.address as string,
        coordinates: spot.coordinates as { lat: number; lng: number },
        timestamp: (spot.timestamp as Date).toISOString(),
        distance: calculateDistance(
          lat,
          lng,
          spot.coordinates.lat,
          spot.coordinates.lng
        ),
      }))
      .filter((spot) => spot.distance <= RADIUS_MILES)
      .sort((a, b) => {
        const timeDiff =
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.distance - b.distance;
      })
      .slice(0, MAX_RESULTS);

    if (spots.length === 0) {
      return NextResponse.json({
        message: `No parking reported in the last hour within ${RADIUS_MILES} miles. Try a different area, or be the first to report a spot.`,
        spots: [],
        total: 0,
        radius: RADIUS_MILES,
      });
    }

    return NextResponse.json({
      message: `Found ${spots.length} parking spot${spots.length !== 1 ? "s" : ""} nearby`,
      spots,
      total: spots.length,
      radius: RADIUS_MILES,
    });
  } catch (error) {
    console.error("Error searching parking spots:", error);
    return NextResponse.json(
      { message: "Failed to search parking spots. Please try again." },
      { status: 500 }
    );
  }
}

/** Haversine distance in miles */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}
