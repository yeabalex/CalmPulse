import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { applyRateLimit } from "@/lib/rateLimit";
import { getGroqApiKey } from "@/lib/ai";

export const runtime = "nodejs";

interface ActivityDetail {
  overview: string;
  howToDo: string;
  steps: string[];
  tips: string[];
  estimatedDuration: string;
}

function buildFallbackDetail(activity: {
  name: string;
  type: string;
  description?: string;
}): ActivityDetail {
  const name = activity.name;
  const type = activity.type || "General";
  const desc = activity.description || "Follow the activity as described in your pacing plan.";

  return {
    overview: `${name} is a ${type.toLowerCase()} pacing habit. ${desc}`,
    howToDo: `When your trigger occurs — "${name}" — stop what you are doing and give yourself space to complete this activity without rushing. Sit or stand with feet flat on the floor, shoulders relaxed, and jaw unclenched. Breathe in slowly through your nose for 4 counts, hold for 2, and exhale for 6. Repeat this cycle while you carry out the activity described in your pacing plan. Move deliberately: notice tension in your chest, shoulders, or stomach, and soften those areas on each exhale. If the activity involves a time block (e.g. 5 minutes), set a timer so you are not watching the clock. When the timer ends, place a hand on your chest, take one final slow breath, and rate your anxiety from 1–10 before returning to your day.`,
    steps: [
      "Pause when the trigger fires — do not push through without doing the activity.",
      "Find a quiet spot; sit or stand with feet grounded and shoulders dropped.",
      "Set a timer matching the activity duration (usually 3–10 minutes).",
      "Begin with 3 slow breaths: inhale 4s, hold 2s, exhale 6s through the nose.",
      `Perform the core action from "${name}" at a calm, unhurried pace.`,
      "Scan your body every 60 seconds — release jaw, unclench fists, drop shoulders.",
      "End with one deep exhale and note your anxiety level (1–10) in your head.",
    ],
    tips: [
      "Start smaller than you think you need — consistency matters more than intensity.",
      "If symptoms spike, pause and return to slow nasal breathing for 60 seconds.",
    ],
    estimatedDuration: "5–10 minutes",
  };
}

function parseActivityDetail(text: string, fallback: ActivityDetail): ActivityDetail {
  try {
    let cleaned = text.trim();
    if (cleaned.startsWith("```json")) cleaned = cleaned.slice(7);
    if (cleaned.startsWith("```")) cleaned = cleaned.slice(3);
    if (cleaned.endsWith("```")) cleaned = cleaned.slice(0, -3);

    const parsed = JSON.parse(cleaned.trim());
    if (
      !parsed.overview ||
      !parsed.howToDo ||
      !Array.isArray(parsed.steps) ||
      parsed.steps.length === 0
    ) {
      return fallback;
    }

    return {
      overview: String(parsed.overview),
      howToDo: String(parsed.howToDo),
      steps: parsed.steps.map((s: unknown) => String(s)),
      tips: Array.isArray(parsed.tips) ? parsed.tips.map((t: unknown) => String(t)) : fallback.tips,
      estimatedDuration: parsed.estimatedDuration
        ? String(parsed.estimatedDuration)
        : fallback.estimatedDuration,
    };
  } catch {
    return fallback;
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "ai:activity-detail",
    limit: 60,
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
    const activityId = typeof body.activityId === "string" ? body.activityId : "";

    if (!activityId) {
      return NextResponse.json({ error: "Missing activityId" }, { status: 400 });
    }

    const db = await getCalmPulseDb();
    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const activities = user.activities || [];
    const activity = activities.find((a: { id: string }) => a.id === activityId);
    if (!activity) {
      return NextResponse.json({ error: "Activity not found" }, { status: 404 });
    }

    const fallback = buildFallbackDetail(activity);
    const apiKey = getGroqApiKey();

    if (!apiKey) {
      return NextResponse.json({ detail: fallback, mode: "mock" });
    }

    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });

    const goal = user.goal || "Reduce Anxiety in 90 Days";
    const focusArea = user.focusArea || user.calculatedReport?.subtype || "General";
    const anxietyScore = user.calculatedReport?.anxietyScore ?? 7;

    const prompt = `You are a clinical somatic pacing coach for CalmPulse.

USER CONTEXT:
- Goal: "${goal}"
- Focus area: "${focusArea}"
- Baseline anxiety score: ${anxietyScore}/10

ACTIVITY TO EXPLAIN:
- Name: "${activity.name}"
- Type: "${activity.type}"
- Short description: "${activity.description || "None"}"

Generate a practical, personalized guide for how to perform this specific pacing activity today.

Return ONLY valid JSON with this exact shape (no markdown):
{
  "overview": "2-3 sentences: what this activity does somatically and when to use it",
  "howToDo": "A detailed 4-6 sentence walkthrough of exactly how to perform this activity from start to finish. Include: when to start (trigger), body position/posture, breathing pattern, what to do with hands/body, pacing/timing, what to notice, and how to end the session.",
  "steps": ["step 1", "step 2", ...],
  "tips": ["tip 1", "tip 2"],
  "estimatedDuration": "e.g. 5 minutes"
}

Requirements:
- "howToDo" is the most important field — write it like you are guiding someone through the activity in real time
- Mention specific body parts, breath counts, and physical actions tied to THIS activity by name
- Provide 5 to 8 numbered steps that break the howToDo into a clear sequence
- Each step must be concrete (e.g. "Inhale for 4 counts through the nose while expanding your ribcage" not "breathe deeply")
- Steps must be specific to THIS activity, not generic wellness advice
- tips: 2 short coaching tips tailored to the user's focus area`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    const detail = parseActivityDetail(response.text, fallback);

    return NextResponse.json({ detail, mode: "ai" });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in activity-detail API:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
