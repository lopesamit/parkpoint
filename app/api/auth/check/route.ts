import { NextResponse } from "next/server";
import { getSession } from "@/app/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({
    user: { id: session.sub, name: session.name, email: session.email },
  });
}
