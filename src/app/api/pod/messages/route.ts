import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";
import { canUserAccessPod, ensureUserPod, MIN_POD_SIZE } from "@/lib/pods";

export const runtime = "nodejs";

function anonymizeName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "Anonymous";
  const first = trimmed.split(/\s+/)[0];
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function GET(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "pod:messages:get",
    limit: 600,
    windowMs: 60 * 60 * 1000,
  });
  if (limited) return limited;

  try {
    const userId = await getCurrentUserObjectId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getCalmPulseDb();
    const podId = await ensureUserPod(db, userId);
    if (!podId) {
      return NextResponse.json({ success: true, messages: [] });
    }

    if (!(await canUserAccessPod(db, podId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const messages = await db
      .collection("pod_messages")
      .find({ podId: podId.toString() })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m._id.toString(),
        userId: m.userId,
        userName: m.userName,
        text: m.text,
        createdAt: m.createdAt,
        isOwn: m.userId === userId.toString(),
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching pod messages:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "pod:messages:post",
    limit: 120,
    windowMs: 60 * 60 * 1000,
    maxBodyBytes: 4 * 1024,
  });
  if (limited) return limited;

  try {
    const userId = await getCurrentUserObjectId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: "Message must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    const db = await getCalmPulseDb();
    const podId = await ensureUserPod(db, userId);
    if (!podId) {
      return NextResponse.json({ error: "No pod assigned" }, { status: 400 });
    }

    if (!(await canUserAccessPod(db, podId, userId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const pod = await db.collection("pods").findOne({ _id: podId });
    const memberCount = pod?.memberIds?.length ?? 0;
    if (memberCount < MIN_POD_SIZE) {
      return NextResponse.json(
        { error: `Pod chat unlocks when at least ${MIN_POD_SIZE} members join` },
        { status: 400 }
      );
    }

    const user = await db.collection("users").findOne({ _id: userId });
    const userName = anonymizeName(user?.name || "Anonymous");

    const doc = {
      podId: podId.toString(),
      userId: userId.toString(),
      userName,
      text,
      createdAt: new Date(),
    };

    const result = await db.collection("pod_messages").insertOne(doc);

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        ...doc,
        isOwn: true,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error posting pod message:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
