import { NextResponse } from "next/server";
import { createHash, randomBytes } from "crypto";
import { getCollection } from "@/app/lib/mongodb";
import { sendPasswordResetEmail } from "@/app/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Same generic response whether or not the account exists,
// so this endpoint can't be used to enumerate emails.
const GENERIC_RESPONSE = {
  message:
    "If an account exists for that email, we've sent a password reset link.",
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const email =
      typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    const users = await getCollection("users");
    const user = await users.findOne({ email });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const tokenHash = createHash("sha256").update(token).digest("hex");

      const resetTokens = await getCollection("password_reset_tokens");
      // Invalidate any previous outstanding links for this user
      await resetTokens.deleteMany({ userId: user._id });
      await resetTokens.insertOne({
        userId: user._id,
        tokenHash,
        expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        createdAt: new Date(),
      });

      const origin = new URL(request.url).origin;
      const resetUrl = `${origin}/reset-password?token=${token}`;
      await sendPasswordResetEmail(email, resetUrl);
    }

    return NextResponse.json(GENERIC_RESPONSE);
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
