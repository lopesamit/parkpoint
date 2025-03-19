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

export async function POST(request: Request) {
  try {
    const data = await request.json();
    
    // Create data directory if it doesn't exist
    const dataDir = path.dirname(PARKING_FILE_PATH);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Read existing reports or initialize empty array
    let reports: ParkingReport[] = [];
    if (fs.existsSync(PARKING_FILE_PATH)) {
      const fileContent = fs.readFileSync(PARKING_FILE_PATH, 'utf8');
      reports = JSON.parse(fileContent);
    }

    // Create new report
    const newReport: ParkingReport = {
      id: Math.random().toString(36).substr(2, 9),
      location: data.location,
      spots: data.spots,
      address: data.address,
      coordinates: data.coordinates,
      timestamp: new Date().toISOString(),
    };

    // Add new report to array
    reports.push(newReport);

    // Save updated reports to file
    fs.writeFileSync(PARKING_FILE_PATH, JSON.stringify(reports, null, 2));

    return NextResponse.json(
      { message: 'Parking report saved successfully', report: newReport },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error saving parking report:', error);
    return NextResponse.json(
      { message: 'Failed to save parking report' },
      { status: 500 }
    );
  }
} 