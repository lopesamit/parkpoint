import { NextResponse } from "next/server";
import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { getCollection } from "@/app/lib/mongodb";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const token = typeof body?.token === "string" ? body.token : "";
    const password = typeof body?.password === "string" ? body.password : "";

    if (!token) {
      return NextResponse.json(
        { message: "Reset token is missing" },
        { status: 400 }
      );
    }
    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = createHash("sha256").update(token).digest("hex");
    const resetTokens = await getCollection("password_reset_tokens");

    const resetRecord = await resetTokens.findOne({
      tokenHash,
      expiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      return NextResponse.json(
        {
          message:
            "This reset link is invalid or has expired. Please request a new one.",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const users = await getCollection("users");
    const result = await users.updateOne(
      { _id: resetRecord.userId },
      { $set: { password: hashedPassword, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { message: "Account no longer exists" },
        { status: 400 }
      );
    }

    // Single use: remove all outstanding tokens for this user
    await resetTokens.deleteMany({ userId: resetRecord.userId });

    return NextResponse.json({
      message: "Password updated. You can now sign in.",
    });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
