import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const { userId, habits, syncTimes, notifications, onboardingComplete } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    // Convert string ID to ObjectId
    let oId: ObjectId;
    try {
      oId = new ObjectId(userId);
    } catch (err) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    // Prepare update payload
    const updateDoc: any = {};
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
  } catch (error: any) {
    console.error("Error in onboarding update API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
