import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";
import { getGroqApiKey } from "@/lib/ai";

export const runtime = "nodejs";

interface GroundingResponse {
  validation: string;
  steps: string[];
}

const FALLBACK_SUGGESTIONS: Array<{ keywords: string[]; response: GroundingResponse }> = [
  {
    keywords: ["heart", "breath", "choke", "suffocate", "chest", "shake", "shaking"],
    response: {
      validation: "I hear that your heart is racing and your body feels tense. You are physically safe, and this stress wave will pass.",
      steps: [
        "Let your out-breath be longer than your in-breath for a few slow rounds.",
        "Splash cool water on your face or hold something cool in your hand.",
        "Drop your shoulders, unclamp your jaw, and let your hands rest completely loose on your lap."
      ]
    }
  },
  {
    keywords: ["work", "exam", "fail", "study", "deadline", "boss", "career", "future"],
    response: {
      validation: "The weight of expectations and future uncertainty is feeling overwhelming right now. This is a moment of stress, not a definition of your capability or your future safety.",
      steps: [
        "Focus on the immediate present: Identify 5 things you can see and 4 things you can physically touch around you.",
        "Stand up and do a gentle 2-minute physical shakeout of your arms and legs to release built-up stress hormones.",
        "Give yourself permission to pause for the next 10 minutes—your worth is not tied to constant performance."
      ]
    }
  },
  {
    keywords: ["people", "social", "crowd", "fight", "talk", "judgment", "judge", "angry"],
    response: {
      validation: "Social friction and feeling judged can feel like an immediate threat to your nervous system. You are safe in your own boundaries, and you have the right to claim space for yourself.",
      steps: [
        "Step away to a quiet, private area (like a restroom or outside) to establish a physical buffer zone.",
        "Place one hand on your chest and the other on your belly, feeling the grounding rise and fall of your breath.",
        "Remind yourself: 'I am not responsible for other people's feelings or reactions right now.'"
      ]
    }
  }
];

const DEFAULT_SUGGESTION: GroundingResponse = {
  validation: "You are experiencing a wave of acute stress right now, but you are safe, and this feeling is temporary. Your body is just trying to protect you, and we can help it settle down together.",
  steps: [
    "Look around and name 3 blue objects in your immediate surroundings to bring your focus back to the present.",
    "Slowly press your feet firmly into the floor, feeling the solid ground supporting your weight.",
    "Take 3 slow, deep belly breaths, focusing entirely on the cool air entering and warm air leaving."
  ]
};

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "ai:panic",
    limit: 60,
    windowMs: 15 * 60 * 1000,
    maxBodyBytes: 15 * 1024,
  });
  if (limited) return limited;

  try {
    const { ventText } = await req.json();
    const cleanText = (ventText || "").trim().toLowerCase();

    const apiKey = getGroqApiKey();

    // Use high-quality mock fallbacks if API key is missing
    if (!apiKey) {
      const match = FALLBACK_SUGGESTIONS.find(s => 
        s.keywords.some(k => cleanText.includes(k))
      );
      const suggestion = match ? match.response : DEFAULT_SUGGESTION;
      return NextResponse.json({ ...suggestion, mode: "mock" });
    }

    // Initialize Groq provider
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: apiKey,
    });

    const prompt = `You are a warm grounding assistant for CalmPulse.
The user is experiencing an intense stress wave and has just written this raw vent log:
"${ventText || "No vent log provided. They are feeling a sudden stress wave."}"

Provide:
1. validation: A warm, validating reassurance of safety (exactly 2 sentences). Reassure them that they are physically safe, that this body response is temporary, and that it can settle.
2. steps: An array of 3 highly actionable grounding tasks customized specifically to target the content or physical symptoms in their vent. Use simple, warm, supportive language.

Return ONLY a JSON object in this format:
{
  "validation": "Validation sentences here.",
  "steps": ["Step 1", "Step 2", "Step 3"]
}

Do not include markdown code block formatting or explanation.`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    let suggestion = DEFAULT_SUGGESTION;
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
      suggestion = JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", response.text, e);
      // Fallback parser lookup if parse fails
      const match = FALLBACK_SUGGESTIONS.find(s => 
        s.keywords.some(k => cleanText.includes(k))
      );
      suggestion = match ? match.response : DEFAULT_SUGGESTION;
    }

    return NextResponse.json({
      ...suggestion,
      mode: "ai"
    });

  } catch (error: any) {
    console.error("Error in panic API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
