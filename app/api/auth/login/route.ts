import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getCollection } from "@/app/lib/mongodb";
import {
  createSessionToken,
  sessionCookieOptions,
  SESSION_COOKIE,
} from "@/app/lib/session";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    const users = await getCollection("users");
    const user = await users.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return NextResponse.json(
        { message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const sessionUser = {
      id: user._id.toString(),
      name: user.name as string,
      email: user.email as string,
    };

    const token = await createSessionToken(sessionUser);

    const response = NextResponse.json(
      { message: "Login successful", user: sessionUser },
      { status: 200 }
    );
    response.cookies.set(SESSION_COOKIE, token, sessionCookieOptions);
    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
