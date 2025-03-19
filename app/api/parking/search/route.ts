import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PARKING_FILE_PATH = path.join(process.cwd(), 'app/data/available_parking.json');

interface ParkingReport {
  id: string;
  location: "current" | "other";
  spots: number;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  timestamp: string;
}

// Calculate distance between two points using the Haversine formula
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const lat = parseFloat(searchParams.get('lat') || '0');
    const lng = parseFloat(searchParams.get('lng') || '0');
    const radius = parseFloat(searchParams.get('radius') || '5'); // Default 5km radius

    if (!lat || !lng) {
      return NextResponse.json(
        { message: 'Latitude and longitude are required' },
        { status: 400 }
      );
    }

    // Read parking reports
    let reports: ParkingReport[] = [];
    if (fs.existsSync(PARKING_FILE_PATH)) {
      const fileContent = fs.readFileSync(PARKING_FILE_PATH, 'utf8');
      reports = JSON.parse(fileContent);
    }

    // First sort by timestamp (newest first)
    reports.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Then filter and sort by distance
    const nearbySpots = reports
      .map(report => ({
        ...report,
        distance: calculateDistance(
          lat,
          lng,
          report.coordinates.lat,
          report.coordinates.lng
        )
      }))
      .filter(spot => spot.distance <= radius)
      .sort((a, b) => {
        // First sort by timestamp (newest first)
        const timeDiff = new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        if (timeDiff !== 0) return timeDiff;
        // If timestamps are equal, sort by distance
        return a.distance - b.distance;
      })
      .slice(0, 10); // Limit to 10 nearest spots

    return NextResponse.json({
      spots: nearbySpots,
      total: nearbySpots.length,
      radius
    });
  } catch (error) {
    console.error('Error searching parking spots:', error);
    return NextResponse.json(
      { message: 'Failed to search parking spots' },
      { status: 500 }
    );
  }
} 