import { NextResponse } from "next/server";
import { getCalmPulseDb } from "@/lib/mongodb";
import { createSession, hashPassword } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, password, assessment } = body;

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const db = await getCalmPulseDb();

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
      clarifyingQuestions: assessment?.clarifyingQuestions || assessment?.questions || null,
      clarifyingAnswers: assessment?.clarifyingAnswers || assessment?.answers || null,
      calculatedReport: assessment?.initialBaseline || assessment?.report || null,
      initialBaseline: assessment?.initialBaseline || assessment?.report || null,
      habits: [],
      syncTimes: { morning: "09:00", evening: "21:00" },
      notifications: { s1: true, s2: true, s3: false },
      onboardingComplete: false
    };

    const result = await db.collection("users").insertOne(userDoc);
    const userIdStr = result.insertedId.toString();

    await createSession({ userId: userIdStr, email: userDoc.email, name });

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
