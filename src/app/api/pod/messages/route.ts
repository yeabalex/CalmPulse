import { after, NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { getGroqApiKey, GROQ_COMPANION_MODEL } from "@/lib/ai";
import {
  buildCompanionMemory,
  extractDurableMemoriesAfterChat,
} from "@/lib/companionMemory";
import type { ObjectId } from "mongodb";

export const runtime = "nodejs";

interface CompanionMessageDoc {
  _id?: ObjectId;
  userId?: string;
  userName?: string;
  text?: string;
  createdAt?: Date | string;
  isOwn?: boolean;
}

interface DemoMessage {
  userName?: unknown;
  text?: unknown;
  isOwn?: unknown;
}

interface DemoContext {
  completedCount?: unknown;
  totalCount?: unknown;
  messages?: unknown;
}

function containsGreeting(text: string) {
  return /\b(hello|hi|hey)\b/i.test(text);
}

function boundedCount(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(99, Math.floor(value)))
    : 0;
}

function normalizeDemoTranscript(messages: unknown) {
  if (!Array.isArray(messages)) return "No recent messages.";

  const lines = messages
    .slice(-12)
    .flatMap((message: DemoMessage) => {
      const text = typeof message.text === "string" ? message.text.trim().slice(0, 500) : "";
      if (!text) return [];
      const speaker = message.isOwn ? "You" : "AI Companion";
      return [`${speaker}: ${text}`];
    });

  return lines.length ? lines.join("\n") : "No recent messages.";
}

async function generateCompanionResponse({
  text,
  completedCount,
  totalCount,
  profileMemory,
  currentStateMemory,
  historyMemory,
  durableMemory,
  conversationMemory,
}: {
  text: string;
  completedCount: number;
  totalCount: number;
  profileMemory: string;
  currentStateMemory: string;
  historyMemory: string;
  durableMemory: string;
  conversationMemory: string;
}) {
  const apiKey = getGroqApiKey();

  if (apiKey) {
    try {
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
      });

      const prompt = `You are the CalmPulse AI pacing companion: a warm, direct, practical coach for pacing, stress regulation, reflection, and habit follow-through.

Safety boundaries:
- You are not a therapist, doctor, crisis service, or emergency service.
- If the user mentions immediate danger, self-harm, fainting, severe chest pain, or inability to stay safe, encourage urgent local/emergency support.
- Do not diagnose or overstate certainty.

Conversation style:
- Sound like a calm person texting, not a report.
- Keep responses natural, specific, and concise: usually 1-3 sentences.
- Use light markdown only when it improves readability: short bullets, **bold** labels, or a small heading. Do not use markdown tables.
- Do not say things like "based on your data", "your records show", or "from the information provided" unless the user asks about their progress, plan, logs, or history.
- Use CalmPulse context silently to choose better advice. Mention specific numbers, activities, triggers, memories, or history only when they directly answer the user's message.
- If the user is venting, start by reflecting the feeling before suggesting one small next step.
- If the user asks what to do, offer one clear action they can start now.
- Do not repeat the welcome message.

PROFILE MEMORY (stable user data, high authority):
${profileMemory}

CURRENT STATE MEMORY (always current, high authority):
${currentStateMemory}

HISTORY MEMORY (wellness trends and latest raw daily log):
${historyMemory}

DURABLE MEMORY (saved personalization facts from prior interactions):
${durableMemory}

CONVERSATION MEMORY (rolling state plus recent raw messages from this single companion thread):
${conversationMemory}

Current user message:
${text}

Write the companion's next reply.`;

      const response = await generateText({
        model: groq(GROQ_COMPANION_MODEL),
        prompt,
        temperature: 0.7,
      });
      return response.text.trim();
    } catch (err) {
      console.error("Error generating AI companion response:", err);
    }
  }

  const lowerText = text.toLowerCase();
  if (containsGreeting(text)) {
    return "Hello, I'm here with you. What feels most important to talk through right now?";
  } else if (lowerText.includes("anxious") || lowerText.includes("stressed") || lowerText.includes("overwhelmed") || lowerText.includes("panic")) {
    return "I hear you. If this feels intense, you can open Calm Space from the bottom-left button for quiet breathing and grounding. Or we can take a few slow breaths together right here.";
  } else if (lowerText.includes("habit") || lowerText.includes("task") || lowerText.includes("pace") || lowerText.includes("do today")) {
    if (completedCount === 0) {
      return "You haven't checked in with a pacing habit today yet. A gentle place to start is the body calm break on your checklist.";
    } else if (completedCount < totalCount) {
      return `You've completed ${completedCount} of ${totalCount} pacing habits today. Pick the easiest remaining one next so the plan keeps moving without adding pressure.`;
    } else {
      return `You've completed all ${totalCount} pacing habits today. Let the rest of the day be maintenance: lower stimulation, keep transitions gentle, and avoid adding extra obligations.`;
    }
  }

  return "Let's keep this small and concrete. Name the one thing that feels heaviest right now, and we can turn it into the next manageable step.";
}

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
      .collection<CompanionMessageDoc>("companion_messages")
      .find({ userId: userId.toString() })
      .sort({ createdAt: 1 })
      .limit(100)
      .toArray();

    if (messages.length === 0) {
      const initialDoc = {
        userId: userId.toString(),
        userName: "AI Companion",
        text: "Hello, I'm here with you. What feels most important to talk through right now?",
        isOwn: false,
        createdAt: new Date(),
      };
      const result = await db.collection("companion_messages").insertOne(initialDoc);
      messages = [{ ...initialDoc, _id: result.insertedId }];
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
    const body = await req.json();
    const text = typeof body.text === "string" ? body.text.trim() : "";

    if (!text || text.length > 500) {
      return NextResponse.json(
        { error: "Message must be between 1 and 500 characters" },
        { status: 400 }
      );
    }

    const isDemo = body.demo === true;

    if (isDemo) {
      const demoContext = (body.demoContext || {}) as DemoContext;
      const completedCount = boundedCount(demoContext.completedCount);
      const totalCount = boundedCount(demoContext.totalCount);
      const conversationMemory = normalizeDemoTranscript(demoContext.messages);
      const botResponse = await generateCompanionResponse({
        text,
        completedCount,
        totalCount,
        profileMemory: [
          "Name: Demo User",
          "Goal: Reduce Anxiety & Regulate Sleep",
          "Focus area: General pacing demo",
          "Initial intake vent: Demo sandbox conversation.",
        ].join("\n"),
        currentStateMemory: [
          `Today: ${completedCount}/${totalCount} pacing activities completed.`,
          "Active activities: Demo user's current dashboard checklist.",
        ].join("\n"),
        historyMemory: "Demo mode does not persist daily reflection history to the database.",
        durableMemory: "Demo mode does not save durable memories.",
        conversationMemory,
      });

      return NextResponse.json({
        success: true,
        message: {
          id: `msg_bot_${Date.now()}`,
          userId: "companion",
          userName: "AI Companion",
          text: botResponse,
          createdAt: new Date().toISOString(),
          isOwn: false,
        },
      });
    }

    const userId = await getCurrentUserObjectId();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    const memory = await buildCompanionMemory(db, userId);
    const { completedCount, totalCount } = memory;
    const botResponse = await generateCompanionResponse({
      text,
      completedCount,
      totalCount,
      profileMemory: memory.profileMemory,
      currentStateMemory: memory.currentStateMemory,
      historyMemory: memory.historyMemory,
      durableMemory: memory.durableMemory,
      conversationMemory: memory.conversationMemory,
    });

    // Save bot message
    const botDoc = {
      userId: userId.toString(),
      userName: "AI Companion",
      text: botResponse,
      isOwn: false,
      createdAt: new Date(),
    };
    const result = await db.collection("companion_messages").insertOne(botDoc);

    after(async () => {
      await extractDurableMemoriesAfterChat(db, userId, text, botResponse, memory);
    });

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
