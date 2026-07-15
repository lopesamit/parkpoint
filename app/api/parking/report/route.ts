import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getCollection } from "@/app/lib/mongodb";
import { getSession } from "@/app/lib/auth";

const MAX_SPOTS = 50;

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { message: "You must be signed in to report parking" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    const location = body?.location;
    const spots = Number(body?.spots);
    const address = typeof body?.address === "string" ? body.address.trim() : "";
    const lat = Number(body?.coordinates?.lat);
    const lng = Number(body?.coordinates?.lng);

    if (location !== "current" && location !== "other") {
      return NextResponse.json(
        { message: "Invalid location type" },
        { status: 400 }
      );
    }
    if (!Number.isInteger(spots) || spots < 1 || spots > MAX_SPOTS) {
      return NextResponse.json(
        { message: `Number of spots must be between 1 and ${MAX_SPOTS}` },
        { status: 400 }
      );
    }
    if (!address || address.length > 300) {
      return NextResponse.json(
        { message: "A valid address is required" },
        { status: 400 }
      );
    }
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

    const report = {
      location,
      spots,
      address,
      coordinates: { lat, lng },
      timestamp: new Date(),
      status: "active" as const,
      reportedBy: new ObjectId(session.sub),
    };

    const result = await reportedParking.insertOne(report);

    return NextResponse.json(
      {
        message: "Parking spot reported successfully",
        report: {
          id: result.insertedId.toString(),
          spots,
          address,
          coordinates: { lat, lng },
          timestamp: report.timestamp.toISOString(),
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error reporting parking:", error);
    return NextResponse.json(
      { message: "Failed to report parking spot. Please try again." },
      { status: 500 }
    );
  }
}
