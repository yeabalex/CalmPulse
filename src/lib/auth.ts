import "server-only";

import crypto from "crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { ObjectId, type Document } from "mongodb";
import { getCalmPulseDb } from "@/lib/mongodb";

const SESSION_COOKIE_NAME = "calmpulse_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7;
const PBKDF2_ALGORITHM = "sha512";
const PBKDF2_ITERATIONS = 220000;
const PBKDF2_KEY_LENGTH = 64;
const LEGACY_PBKDF2_ITERATIONS = 1000;

export interface AuthUser {
  userId: string;
  name: string;
  email: string;
  onboardingComplete: boolean;
  habits: unknown[];
  syncTimes: { morning: string; evening: string };
  notifications: Record<string, boolean>;
}

interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  name: string;
}

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (secret) {
    return secret;
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET is required in production");
  }

  return "calmpulse-development-jwt-secret-change-me";
}

function getEncodedJwtSecret() {
  return new TextEncoder().encode(getJwtSecret());
}

function shouldUseSecureSessionCookie() {
  const explicit = process.env.SESSION_COOKIE_SECURE;

  if (explicit) {
    return explicit.toLowerCase() === "true";
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  return Boolean(appUrl?.startsWith("https://"));
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEY_LENGTH, PBKDF2_ALGORITHM)
    .toString("hex");

  return `pbkdf2:${PBKDF2_ALGORITHM}:${PBKDF2_ITERATIONS}:${salt}:${hash}`;
}

function deriveHash(password: string, salt: string, iterations: number, algorithm: string) {
  return crypto.pbkdf2Sync(password, salt, iterations, PBKDF2_KEY_LENGTH, algorithm).toString("hex");
}

function timingSafeHexCompare(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  return (
    actualBuffer.length === expectedBuffer.length &&
    crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export function verifyPassword(password: string, storedHash: string) {
  const parts = storedHash.split(":");

  if (parts.length === 5 && parts[0] === "pbkdf2") {
    const [, algorithm, iterationsRaw, salt, expectedHash] = parts;
    const iterations = Number(iterationsRaw);

    if (!algorithm || !Number.isInteger(iterations) || iterations <= 0 || !salt || !expectedHash) {
      return { valid: false, needsRehash: false };
    }

    const actualHash = deriveHash(password, salt, iterations, algorithm);

    return {
      valid: timingSafeHexCompare(actualHash, expectedHash),
      needsRehash: algorithm !== PBKDF2_ALGORITHM || iterations < PBKDF2_ITERATIONS,
    };
  }

  if (parts.length === 2) {
    const [salt, expectedHash] = parts;
    const actualHash = deriveHash(password, salt, LEGACY_PBKDF2_ITERATIONS, PBKDF2_ALGORITHM);

    return {
      valid: timingSafeHexCompare(actualHash, expectedHash),
      needsRehash: true,
    };
  }

  return { valid: false, needsRehash: false };
}

export async function createSession(user: { userId: string; email: string; name: string }) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_SECONDS * 1000);
  const token = await new SignJWT({
    userId: user.userId,
    email: user.email,
    name: user.name,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.userId)
    .setIssuedAt()
    .setExpirationTime(Math.floor(expiresAt.getTime() / 1000))
    .sign(getEncodedJwtSecret());

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: shouldUseSecureSessionCookie(),
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionPayload() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getEncodedJwtSecret(), {
      algorithms: ["HS256"],
    });

    if (typeof payload.userId !== "string" || typeof payload.email !== "string") {
      return null;
    }

    return payload as SessionPayload;
  } catch {
    try {
      const legacyUserId = new ObjectId(token).toString();
      return {
        userId: legacyUserId,
        email: "",
        name: "",
        sub: legacyUserId,
      } satisfies SessionPayload;
    } catch {
      return null;
    }
  }
}

export async function getCurrentUserObjectId() {
  const session = await getSessionPayload();

  if (!session?.userId) {
    return null;
  }

  try {
    return new ObjectId(session.userId);
  } catch {
    return null;
  }
}

export function toSafeUser(user: Document): AuthUser {
  return {
    userId: user._id.toString(),
    name: typeof user.name === "string" ? user.name : "",
    email: typeof user.email === "string" ? user.email : "",
    onboardingComplete: Boolean(user.onboardingComplete),
    habits: Array.isArray(user.habits) ? user.habits : [],
    syncTimes:
      user.syncTimes && typeof user.syncTimes === "object"
        ? {
            morning: typeof user.syncTimes.morning === "string" ? user.syncTimes.morning : "09:00",
            evening: typeof user.syncTimes.evening === "string" ? user.syncTimes.evening : "21:00",
          }
        : { morning: "09:00", evening: "21:00" },
    notifications:
      user.notifications && typeof user.notifications === "object" ? user.notifications : {},
  };
}

export async function getCurrentUser() {
  const session = await getSessionPayload();

  if (!session?.userId) {
    return null;
  }

  let userObjectId: ObjectId;
  try {
    userObjectId = new ObjectId(session.userId);
  } catch {
    return null;
  }

  const db = await getCalmPulseDb();
  const user = await db.collection("users").findOne({ _id: userObjectId });

  return user ? toSafeUser(user) : null;
}
