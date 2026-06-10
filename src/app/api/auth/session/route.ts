import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "auth:session",
    limit: 600,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await getCurrentUserObjectId();

    if (!userId) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const db = await getCalmPulseDb();

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
