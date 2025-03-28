import { NextResponse } from "next/server";
import { getCollection } from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { location, spots, address, coordinates } = data;

    // Validate required fields
    if (!location || !spots || !address || !coordinates) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get the reported_parking collection
    const reportedParking = await getCollection("reported_parking");

    // Create the parking report document
    const report = {
      location,
      spots,
      address,
      coordinates,
      timestamp: new Date(),
      status: "active", // You can use this to mark spots as taken/available
    };

    // Insert the report into MongoDB
    const result = await reportedParking.insertOne(report);

    if (!result.acknowledged) {
      throw new Error("Failed to save parking report");
    }

    return NextResponse.json(
      { message: "Parking spot reported successfully", report },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error reporting parking:", error);
    return NextResponse.json(
      { message: "Failed to report parking spot" },
      { status: 500 }
    );
  }
} 