import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("calmpulse_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { activityId, completed } = await req.json();

    if (!activityId) {
      return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("calmpulse");

    let userId: ObjectId;
    try {
      userId = new ObjectId(sessionCookie.value);
    } catch {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const updateQuery = completed
      ? { $addToSet: { completedActivities: activityId } }
      : { $pull: { completedActivities: activityId } };

    const result = await db.collection("users").updateOne(
      { _id: userId },
      updateQuery
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: completed ? "Activity completed" : "Activity uncompleted"
    });
  } catch (error: any) {
    console.error("Error in complete-activity API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
