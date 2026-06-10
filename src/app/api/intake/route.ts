import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";

const FALLBACK_QUESTIONS: Record<string, string[]> = {
  "Social & Performance Anxiety": [
    "Does the racing heart spike more during the anticipation (e.g. preparing slides) or during the actual event (e.g. presenting)?",
    "Are you experiencing physical tension (such as a clenched jaw or tight shoulders) at this moment?",
    "After a social stressor, do you tend to spend significant time mentally replaying your performance?"
  ],
  "Generalized Tension & Panic": [
    "Do you notice your breathing becoming shallow, rapid, or irregular when the tension begins to spike?",
    "Is there a specific time of day when this physical restlessness feels most overwhelming?",
    "Have you noticed any somatic warnings (like sudden temperature changes or dizziness) before the tension peaks?"
  ],
  "Burnout & Attention Fatigue": [
    "Are you experiencing screen aversion, eye strain, or a feeling of mental sluggishness when trying to focus?",
    "Do you find it difficult to transition out of work mode, or do you feel a lingering sense of guilt when taking breaks?",
    "What does your typical digital routine look like in the final 90 minutes before you sleep?"
  ]
};

const DEFAULT_QUESTIONS = [
  "What physical symptoms (like a racing heart, shallow breathing, or restlessness) do you notice first when this feeling starts?",
  "Does this feeling tend to build up slowly over the day, or does it hit you in sudden, intense waves?",
  "What is one small boundary or grounding exercise that has successfully helped you calm down in the past?"
];

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "ai:intake",
    limit: 120,
    windowMs: 60 * 60 * 1000,
    maxBodyBytes: 50 * 1024,
  });
  if (limited) return limited;

  try {
    const { focusArea, ventText } = await req.json();

    if (!focusArea) {
      return NextResponse.json({ error: "Missing focusArea" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

    // Fallback to mock responses if API key is missing
    if (!apiKey) {
      const questions = FALLBACK_QUESTIONS[focusArea] || DEFAULT_QUESTIONS;
      return NextResponse.json({
        questions: questions.map((q, i) => ({ id: `q${i + 1}`, question: q })),
        mode: "mock"
      });
    }

    // Initialize Groq provider via @ai-sdk/openai
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: apiKey,
    });

    const CALMPULSE_PRIOR_KNOWLEDGE = `
CalmPulse Clinical Pacing Methodology:
1. Social & Performance Anxiety: Structured cognitive pacing prior to events, caffeine restrictions (4 hours buffer before triggers), and post-stressor grounding intervals. Focused on "Social Receptive Index".
2. Generalized Tension & Panic: Somatic monitoring, vagus nerve breathing pacers (e.g. 4-7-8 cycles), cold-water sensory grounding, and interval breaks (5m screen-free rest every 60m of continuous activity). Focused on "Hyper-Arousal Hyper-Pacing" model.
3. Burnout & Attention Fatigue: Digital boundary buffers (disable screen syncs after 9:30 PM), structured workflow intervals (50-10 work-rest cycles), and mid-day physical activation stretches. Focused on "Cognitive Load Recovery" model.
`;

    const prompt = `You are a warm, supportive, and clinical AI mental health intake assistant for the CalmPulse app.
Here is the CalmPulse Clinical Pacing Methodology (Prior Knowledge):
${CALMPULSE_PRIOR_KNOWLEDGE}

The user has chosen the focus area: "${focusArea}".
They vented the following: "${ventText || "No vent provided."}".

Based on the CalmPulse pacing methodology, their focus area, and their vent, generate exactly 3 highly targeted clarifying questions. 
These questions should help CalmPulse calibrate their autonomic pacing parameters (such as somatic triggers, screen habits, and breathing changes).

Return ONLY a JSON array of strings containing the questions. Do not include markdown code block formatting or any other text.
Example format:
[
  "Question 1 here?",
  "Question 2 here?",
  "Question 3 here?"
]`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    let questions: string[] = [];
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
      console.error("Failed to parse AI response:", response.text, e);
      questions = FALLBACK_QUESTIONS[focusArea] || DEFAULT_QUESTIONS;
    }

    const formattedQuestions = questions.map((q, i) => ({
      id: `q${i + 1}`,
      question: q
    }));

    return NextResponse.json({
      questions: formattedQuestions,
      mode: "ai"
    });
  } catch (error: any) {
    console.error("Error in intake API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
