import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { applyRateLimit } from "@/lib/rateLimit";
import { getGroqApiKey } from "@/lib/ai";

export const runtime = "nodejs";

interface BaselineReport {
  anxietyScore: number;
  subtype: string;
  symptoms: string[];
  pacingRate: string;
  adjustments: Array<{
    name: string;
    type: string;
    trigger: string;
    description: string;
  }>;
  cohortId: number;
  cohortDescription: string;
}

const FALLBACK_REPORTS: Record<string, BaselineReport> = {
  "Social & Performance Anxiety": {
    anxietyScore: 7.4,
    subtype: "Social & Performance Anxiety",
    symptoms: ["Performance Worry", "Racing Heart", "Shoulder Tension", "Replaying Events"],
    pacingRate: "40% Decelerated",
    adjustments: [
      { name: "Pre-Event Screen Buffer", type: "Digital", trigger: "Turn off screens 30m prior to social events", description: "Calms your nervous system to prevent racing heart before socializing." },
      { name: "Cognitive Grounding Guidance", type: "Auditory", trigger: "Listen to 5m grounding session post-event", description: "Stops repetitive thoughts and calms your mind after events." },
      { name: "Adrenaline Restrict (Caffeine)", type: "Dietary", trigger: "Zero caffeine intake 4 hours before speech/event", description: "Prevents caffeine from triggering physical anxiety symptoms like shaking." }
    ],
    cohortId: 42,
    cohortDescription: "Social and Performance anxiety cohort pod. Focuses on pre-event breathing buffers and post-event cognitive declutter milestones."
  },
  "Generalized Tension": {
    anxietyScore: 8.2,
    subtype: "Generalized Tension",
    symptoms: ["Body Restlessness", "Shallow Breathing", "Jaw Clenching", "Sudden Stress Waves"],
    pacingRate: "50% Decelerated",
    adjustments: [
      { name: "Breathing Break", type: "Body Calm", trigger: "Take a breathing break every 3 hours", description: "Slows your breathing to signal safety to your body." },
      { name: "Cool Water Grounding", type: "Sensory", trigger: "Use cool water or an ice pack during stress waves", description: "Helps your body shift out of alarm." },
      { name: "Screen-Free Pacing Breaks", type: "Interval", trigger: "Take 5m screen-free rest every 60m of continuous activity", description: "Relieves muscle tension and stops stress from building up." }
    ],
    cohortId: 108,
    cohortDescription: "Generalized tension pod. Focuses on body calm checks, physical grounding, and stress cooldown routines."
  },
  "Burnout & Attention Fatigue": {
    anxietyScore: 6.8,
    subtype: "Burnout & Attention Fatigue",
    symptoms: ["Cognitive Fatigue", "Attention Exhaustion", "Screen Aversion", "Pre-Sleep Restlessness"],
    pacingRate: "30% Decelerated",
    adjustments: [
      { name: "Digital Detach (9:30 PM)", type: "Digital", trigger: "Disable all digital communications at 9:30 PM", description: "Gives your brain a screen break to help you sleep." },
      { name: "Focus-Rest Interval (50-10)", type: "Workflow", trigger: "Strict 10m off-screen transition every 50m of work", description: "Prevents brain fatigue by enforcing regular, short screen rests." },
      { name: "Physical Re-activation Stretch", type: "Physical", trigger: "Do a 5m full body stretch routine at 2:00 PM", description: "Gets blood flowing to shake off mid-afternoon fatigue." }
    ],
    cohortId: 89,
    cohortDescription: "Burnout Recovery cohort pod. Targeting screen-free work transitions and evening digital boundary schedules."
  }
};

const DEFAULT_REPORT = {
  anxietyScore: 7.0,
  subtype: "General Anxiety & Stress",
  symptoms: ["Mental Fatigue", "Muscle Tension", "Stress Response"],
  pacingRate: "35% Decelerated",
  adjustments: [
    { name: "Mindful Pacing Pause", type: "Body Calm", trigger: "Take a 5m breathing pause every 3 hours", description: "Lets you check in with your body to keep stress low." },
    { name: "Evening Digital Boundary", type: "Digital", trigger: "Disconnect screens 60m before sleeping", description: "Prepares your brain for sleep by keeping screens away." }
  ],
  cohortId: 15,
  cohortDescription: "General behavioral pacing and stress management pod."
};

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "ai:baseline",
    limit: 120,
    windowMs: 60 * 60 * 1000,
    maxBodyBytes: 80 * 1024,
  });
  if (limited) return limited;

  try {
    const { focusArea, ventText, answers } = await req.json();

    if (!focusArea) {
      return NextResponse.json({ error: "Missing focusArea" }, { status: 400 });
    }

    const apiKey = getGroqApiKey();

    // Fallback to mock responses if API key is missing
    if (!apiKey) {
      const report = FALLBACK_REPORTS[focusArea] || DEFAULT_REPORT;
      return NextResponse.json({ report, mode: "mock" });
    }

    // Initialize Groq provider via @ai-sdk/openai
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: apiKey,
    });

    const CALMPULSE_PRIOR_KNOWLEDGE = `
CalmPulse gentle pacing method:
1. Social & Performance Anxiety: Structured cognitive pacing prior to events, caffeine restrictions (4 hours buffer before triggers), and post-stressor grounding intervals. Focused on "Social Receptive Index".
2. Generalized Tension: body calm checks, slow breathing breaks, cool-water grounding, and interval breaks (5m screen-free rest every 60m of continuous activity).
3. Burnout & Attention Fatigue: Digital boundary buffers (disable screen syncs after 9:30 PM), structured workflow intervals (50-10 work-rest cycles), and mid-day physical activation stretches. Focused on "Cognitive Load Recovery" model.
`;

    const prompt = `You are a clinical AI diagnostic profiling assistant for the CalmPulse app.
Here is the CalmPulse Clinical Pacing Methodology (Prior Knowledge):
${CALMPULSE_PRIOR_KNOWLEDGE}

The user's selected focus area: "${focusArea}".
Their original vent log: "${ventText || "No log provided"}"
Their answers to clarifying questions:
${JSON.stringify(answers || {})}

Construct a detailed, structured diagnostic baseline report based on their inputs and the CalmPulse pacing methodology.
Calculate the following parameters:
1. anxietyScore: A decimal number between 1.0 and 10.0 indicating their subjective anxiety severity.
2. subtype: The matched anxiety subtype (use "${focusArea}").
3. symptoms: A list of 4 key thoughts or body sensations identified from their responses.
4. pacingRate: A percentage decelerated pacing target (e.g., "45% Decelerated").
5. adjustments: An array of 3 custom behavioral habit adjustments matching the CalmPulse pacing guidelines for this subtype. Each adjustment should have:
   - "name": the habit name.
   - "type": the type (e.g., Body Calm, Digital, Workflow, Dietary).
   - "trigger": the explicit schedule/condition (e.g. "Use cool water when stress rises").
   - "description": a short explanation in simple, easy-to-understand words (max 12 words) of how it physically calms the body or helps the nervous system.
6. cohortId: A random integer between 10 and 150.
7. cohortDescription: A 2-sentence description of an anonymous cohort group of 5-8 peers facing similar symptoms and pacing goals.

Return ONLY a JSON object containing the report. Do not include markdown code block formatting.
Example format:
{
  "anxietyScore": 7.5,
  "subtype": "Generalized Tension",
  "symptoms": ["Body restlessness", "Jaw clenching"],
  "pacingRate": "45% Decelerated",
  "adjustments": [
    { "name": "Breathing break", "type": "Body Calm", "trigger": "Every 3 hours", "description": "Slows breathing to calm body." }
  ],
  "cohortId": 42,
  "cohortDescription": "Cohort description here."
}`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

    let report = DEFAULT_REPORT;
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
      report = JSON.parse(text.trim());
    } catch (e) {
      console.error("Failed to parse AI response:", response.text, e);
      report = FALLBACK_REPORTS[focusArea] || DEFAULT_REPORT;
    }

    return NextResponse.json({
      report,
      mode: "ai"
    });
  } catch (error: unknown) {
    console.error("Error in baseline API:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal Server Error", details: errMsg },
      { status: 500 }
    );
  }
}
