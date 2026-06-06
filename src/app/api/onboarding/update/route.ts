import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

export async function POST(req: Request) {
  try {
    const { habits, syncTimes, notifications, onboardingComplete } = await req.json();
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    // Convert string ID to ObjectId
    let oId: ObjectId;
    try {
      oId = new ObjectId(currentUser.userId);
    } catch {
      return NextResponse.json({ error: "Invalid session user" }, { status: 400 });
    }

    // Prepare update payload
    const updateDoc: Record<string, unknown> = {};
    if (habits !== undefined) updateDoc.habits = habits;
    if (syncTimes !== undefined) updateDoc.syncTimes = syncTimes;
    if (notifications !== undefined) updateDoc.notifications = notifications;
    if (onboardingComplete !== undefined) updateDoc.onboardingComplete = onboardingComplete;

    const result = await db.collection("users").updateOne(
      { _id: oId },
      { $set: updateDoc }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      updated: true
    });
  } catch (error: unknown) {
    console.error("Error in onboarding update API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: getErrorMessage(error) },
      { status: 500 }
    );
  }
}
