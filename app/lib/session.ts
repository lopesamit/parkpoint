/**
 * Stateless signed sessions using HMAC-SHA256 via the Web Crypto API,
 * so tokens can be verified both in Node route handlers and in Edge middleware.
 *
 * Token format: base64url(payload JSON) + "." + base64url(signature)
 */

export const SESSION_COOKIE = "pp_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 1 week

export interface SessionPayload {
  /** User id (Mongo ObjectId as hex string) */
  sub: string;
  name: string;
  email: string;
  /** Expiry, unix seconds */
  exp: number;
}

const encoder = new TextEncoder();

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your environment.");
  }
  return secret;
}

async function getHmacKey(usage: KeyUsage): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    [usage]
  );
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function createSessionToken(
  user: { id: string; name: string; email: string },
  maxAgeSeconds: number = SESSION_MAX_AGE_SECONDS
): Promise<string> {
  const payload: SessionPayload = {
    sub: user.id,
    name: user.name,
    email: user.email,
    exp: Math.floor(Date.now() / 1000) + maxAgeSeconds,
  };
  const payloadBytes = encoder.encode(JSON.stringify(payload));
  const key = await getHmacKey("sign");
  const signature = await crypto.subtle.sign("HMAC", key, payloadBytes);
  return `${toBase64Url(payloadBytes)}.${toBase64Url(new Uint8Array(signature))}`;
}

export async function verifySessionToken(
  token: string | undefined | null
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  try {
    const payloadBytes = fromBase64Url(parts[0]);
    const signatureBytes = fromBase64Url(parts[1]);
    const key = await getHmacKey("verify");
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as ArrayBuffer,
      payloadBytes as unknown as ArrayBuffer
    );
    if (!valid) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(payloadBytes)
    ) as SessionPayload;

    if (!payload.sub || !payload.exp) return null;
    if (payload.exp * 1000 < Date.now()) return null;

    return payload;
  } catch {
    return null;
  }
}

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
};
