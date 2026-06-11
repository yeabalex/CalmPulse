import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getGroqApiKey } from "@/lib/ai";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "companion:messages:get",
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
    
    let messages = await db
      .collection("companion_messages")
      .find({ userId: userId.toString() })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    if (messages.length === 0) {
      const initialDoc = {
        userId: userId.toString(),
        userName: "AI Companion",
        text: "Hello! I am your AI Pacing Companion. I monitor your daily pacing indicators and can help guide you through anxiety triggers or schedule adjustments. How are you feeling today?",
        isOwn: false,
        createdAt: new Date(),
      };
      await db.collection("companion_messages").insertOne(initialDoc);
      messages = [initialDoc as any];
    }

    return NextResponse.json({
      success: true,
      messages: messages.map((m) => ({
        id: m._id ? m._id.toString() : `msg_${Date.now()}`,
        userId: m.userId,
        userName: m.userName,
        text: m.text,
        createdAt: m.createdAt,
        isOwn: m.isOwn,
      })),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error fetching companion messages:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "companion:messages:post",
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
    
    // Save user message
    const userDoc = {
      userId: userId.toString(),
      userName: "You",
      text,
      isOwn: true,
      createdAt: new Date(),
    };
    await db.collection("companion_messages").insertOne(userDoc);

    // Get user statistics/context
    const user = await db.collection("users").findOne({ _id: userId });
    const goal = user?.goal || "Reduce Anxiety & Regulate Sleep";
    const focusArea = user?.calculatedReport?.subtype || "General";
    const anxietyScore = user?.calculatedReport?.anxietyScore ?? 6.8;
    const completedCount = user?.completedActivities?.length || 0;
    const totalCount = user?.activities?.length || 0;

    // Fetch last 10 messages for conversation context
    const recentChatHistory = await db
      .collection("companion_messages")
      .find({ userId: userId.toString() })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();
    recentChatHistory.reverse();

    const historyPrompt = recentChatHistory
      .map((m) => `${m.userName}: ${m.text}`)
      .join("\n");

    const apiKey = getGroqApiKey();
    let botResponse = "";

    if (apiKey) {
      try {
        const groq = createOpenAI({
          baseURL: "https://api.groq.com/openai/v1",
          apiKey,
        });

        const prompt = `You are a clinical AI pacing companion for CalmPulse.
    
USER STATS TODAY:
- Goal: "${goal}"
- Focus Area: "${focusArea}"
- Current Anxiety Baseline Score: ${anxietyScore.toFixed(1)}/10
- Habits Completed Today: ${completedCount} out of ${totalCount}

RECENT CONVERSATION HISTORY:
${historyPrompt}

Generate a short, empathetic response (1-3 sentences) from the perspective of the AI Companion.
- Reference their habit progress (${completedCount}/${totalCount}) and stress level (${anxietyScore.toFixed(1)}) if contextually relevant.
- Suggest a somatic breathing check, screen limits, or pacing stroll if they are feeling anxious.
- Do not repeat the welcome message. Keep it conversational and brief.`;

        const response = await generateText({
          model: groq("llama-3.3-70b-versatile"),
          prompt,
        });
        botResponse = response.text.trim();
      } catch (err) {
        console.error("Error generating AI companion response:", err);
      }
    }

    // Fallback response if AI fails or no apiKey
    if (!botResponse) {
      const lowerText = text.toLowerCase();
      if (lowerText.includes("hello") || lowerText.includes("hi") || lowerText.includes("hey")) {
        botResponse = `Hello! I'm here. Looking at your records today, you have completed ${completedCount} of your ${totalCount} daily pacing plan habits, and your current stress baseline is at ${anxietyScore.toFixed(1)}/10. What is on your mind?`;
      } else if (lowerText.includes("anxious") || lowerText.includes("stressed") || lowerText.includes("overwhelmed") || lowerText.includes("panic")) {
        botResponse = `I hear you. If you are experiencing somatic spikes, I highly recommend clicking the red SOS button in the bottom right corner to start immediate breathing guidance. Or we can practice a 4-7-8 breathing pause right here.`;
      } else if (lowerText.includes("habit") || lowerText.includes("task") || lowerText.includes("pace") || lowerText.includes("do today")) {
        if (completedCount === 0) {
          botResponse = `You haven't completed any pacing habits today yet. I recommend starting with the "Somatic Grounding Pause" (5m breathing break) on your checklist to help lower your ${anxietyScore.toFixed(1)} stress score.`;
        } else if (completedCount < totalCount) {
          botResponse = `You've checked off ${completedCount} pacing habits so far. Great effort! Try completing the remaining activities to satisfy today's pacing target.`;
        } else {
          botResponse = `Excellent work! You have completed all ${totalCount} pacing habits for today. Your stress baseline has been successfully decelerated.`;
        }
      } else {
        botResponse = `Pacing is all about small, steady adjustments. Since your stress score is currently ${anxietyScore.toFixed(1)}, let's focus on setting tight boundaries on your digital notifications this evening.`;
      }
    }

    // Save bot message
    const botDoc = {
      userId: userId.toString(),
      userName: "AI Companion",
      text: botResponse,
      isOwn: false,
      createdAt: new Date(),
    };
    const result = await db.collection("companion_messages").insertOne(botDoc);

    return NextResponse.json({
      success: true,
      message: {
        id: result.insertedId.toString(),
        userId: botDoc.userId,
        userName: botDoc.userName,
        text: botDoc.text,
        createdAt: botDoc.createdAt.toISOString(),
        isOwn: false,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error posting companion message:", error);
    return NextResponse.json({ error: "Internal Server Error", details: message }, { status: 500 });
  }
}
