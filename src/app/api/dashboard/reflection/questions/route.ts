import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";

export const runtime = "nodejs";

const DEFAULT_QUESTIONS = [
  "Have you noticed your muscle tension (e.g. neck, jaw) increasing or decreasing during today's pacing exercises?",
  "What was the most challenging pacing habit to maintain today, and why?",
  "Did you experience any sudden peaks of arousal or stress today? If so, how did you respond somatic-wise?"
];

export async function GET() {
  try {
    const userId = await getCurrentUserObjectId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getCalmPulseDb();

    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      // Mock questions if no API key is present
      return NextResponse.json({ questions: DEFAULT_QUESTIONS, mode: "mock" });
    }

    // Initialize Groq provider
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: apiKey,
    });

    const recentLogs = user.dailyLogs ? user.dailyLogs.slice(-3) : [];
    const goal = user.goal || "Reduce Anxiety in 90 Days";
    const subtype = user.calculatedReport?.subtype || "Generalized Stress";

    const prompt = `You are a clinical AI coach for CalmPulse.
The user's goal: "${goal}".
The user's anxiety subtype: "${subtype}".
Their recent daily logs summary (if any):
${JSON.stringify(recentLogs)}

It is now the end of the day. The user is checking in. Generate exactly 3 highly targeted clarifying questions to ask them in their Daily Reflection modal. 
These questions should touch on their somatic symptom progression, habit compliance, or mental state based on their clinical goal context.

Return ONLY a JSON array of strings containing the questions. Do not include markdown code block formatting or other commentary.
Example:
[
  "Question 1?",
  "Question 2?",
  "Question 3?"
]`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    let questions = DEFAULT_QUESTIONS;
    try {
      let text = response.text.trim();
      if (text.startsWith("```json")) {
        text = text.substring(7);
      }
      if (text.startsWith("```")) {
        text = text.substring(3);
      }
      if (text.endsWith("```")) {
        text = text.substring(0, text.length - 3);
      }
      questions = JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to parse AI reflection questions:", response.text, e);
    }

    return NextResponse.json({ questions, mode: "ai" });
  } catch (error: any) {
    console.error("Error in reflection questions API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
