import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/app/lib/session";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out successfully" });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
