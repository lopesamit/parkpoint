import { NextResponse } from 'next/server';
import { getCollection } from "@/app/lib/mongodb";
import { ObjectId } from "mongodb";

interface ParkingSpot {
  _id: ObjectId;
  location: "current" | "other";
  spots: number;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: Date;
  status: "active" | "taken";
  distance?: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');

    if (!lat || !lng) {
      return NextResponse.json(
        { message: 'Missing coordinates' },
        { status: 400 }
      );
    }

    // Get the reported_parking collection
    const reportedParking = await getCollection("reported_parking");

    // Find all active parking spots
    const spots = await reportedParking
      .find({ status: "active" })
      .sort({ timestamp: -1 }) // Sort by newest first
      .toArray() as ParkingSpot[];

    // Calculate distances and filter spots within radius
    const RADIUS_MILES = 0.5; // 0.5 miles radius
    const nearbySpots = spots
      .map((spot) => {
        const distance = calculateDistance(
          lat,
          lng,
          spot.coordinates.lat,
          spot.coordinates.lng
        );
        return {
          ...spot,
          distance,
        };
      })
      .filter((spot) => spot.distance <= RADIUS_MILES)
      .sort((a, b) => {
        // Sort by timestamp first (newest), then by distance
        const timeDiff = b.timestamp.getTime() - a.timestamp.getTime();
        if (timeDiff !== 0) return timeDiff;
        return a.distance! - b.distance!;
      })
      .slice(0, 10); // Limit to 10 nearest spots

    // Check if any spots were found
    if (nearbySpots.length === 0) {
      return NextResponse.json({
        message: "No parking spots available within 0.5 miles of your location. Try expanding your search radius or report a new parking spot.",
        spots: [],
        total: 0,
        radius: RADIUS_MILES
      });
    }

    return NextResponse.json({
      message: `Found ${nearbySpots.length} parking spot${nearbySpots.length !== 1 ? 's' : ''} near you`,
      spots: nearbySpots,
      total: nearbySpots.length,
      radius: RADIUS_MILES
    });
  } catch (error) {
    console.error('Error searching parking spots:', error);
    return NextResponse.json(
      { message: 'Failed to search parking spots' },
      { status: 500 }
    );
  }
}

// Helper function to calculate distance between two points using the Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3959; // Earth's radius in miles
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