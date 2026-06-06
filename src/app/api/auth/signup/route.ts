import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { createSession, hashPassword, toSafeUser } from "@/lib/auth";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, assessment } = body;
    const normalizedName = typeof name === "string" ? name.trim() : "";
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";

    if (!normalizedName || !normalizedEmail || typeof password !== "string") {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    // Check if user already exists
    const existingUser = await db.collection("users").findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ error: "Email is already registered" }, { status: 409 });
    }

    const passwordHash = hashPassword(password);

    // Create user document
    const userDoc = {
      name: normalizedName,
      email: normalizedEmail,
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
    const user = {
      ...userDoc,
      _id: result.insertedId
    };

    await createSession({
      userId: result.insertedId.toString(),
      email: userDoc.email,
      name: userDoc.name
    });

    return NextResponse.json({
      message: "Account created successfully",
      user: toSafeUser(user)
    });
  } catch (error: unknown) {
    console.error("Error in signup API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
