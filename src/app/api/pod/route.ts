import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";
import { ensureUserPod, getPodSummary } from "@/lib/pods";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "pod:get",
    limit: 300,
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
      return NextResponse.json({
        success: true,
        pod: null,
        message: "Complete onboarding to join a cohort pod.",
      });
    }

    const summary = await getPodSummary(db, podId, userId);
    if (!summary) {
      return NextResponse.json({ error: "Pod not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, pod: summary });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in pod API:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
