import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("calmpulse_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    let userId: ObjectId;
    try {
      userId = new ObjectId(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await db.collection("users").findOne(
      { _id: userId },
      { projection: { passwordHash: 0 } }
    );

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        goal: user.goal || null,
        onboardingComplete: user.onboardingComplete || false,
        cohortId: user.calculatedReport?.cohortId || null
      }
    });
  } catch (error: any) {
    console.error("Error in session API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
