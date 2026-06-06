import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";
import { cookies } from "next/headers";

export const runtime = "nodejs";

// Secure native PBKDF2 password hashing helper
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, "sha512").toString("hex");
  return `${salt}:${hash}`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, assessment } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    // Create user document
    const userDoc = {
      name,
      email: email.toLowerCase(),
      passwordHash,
      createdAt: new Date(),
      focusArea: assessment?.focusArea || null,
      ventText: assessment?.ventText || null,
      clarifyingAnswers: assessment?.answers || null,
      calculatedReport: assessment?.report || null,
      habits: [],
      syncTimes: { morning: "09:00", evening: "21:00" },
      notifications: { s1: true, s2: true, s3: false },
      onboardingComplete: false
    };

    const result = await db.collection("users").insertOne(userDoc);
    const userIdStr = result.insertedId.toString();

    // Set HTTP-only cookie to log user in instantly
    const cookieStore = await cookies();
    cookieStore.set("calmpulse_session", userIdStr, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
      sameSite: "lax"
    });

    return NextResponse.json({
      message: "Account created successfully",
      userId: userIdStr,
      name
    });
  } catch (error: any) {
    console.error("Error in signup API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
