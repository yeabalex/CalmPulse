import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FALLBACK_REPORTS: Record<string, any> = {
  "Social & Performance Anxiety": {
    anxietyScore: 7.4,
    subtype: "Social & Performance Anxiety",
    symptoms: ["Performance Anticipation", "Autonomic Spikes (Racing Heart)", "Shoulder Tension", "Post-Event Cognitive Rumination"],
    pacingRate: "40% Decelerated",
    adjustments: [
      { name: "Pre-Event Screen Buffer", type: "Digital", trigger: "Turn off screens 30m prior to social events" },
      { name: "Cognitive Grounding Guidance", type: "Auditory", trigger: "Listen to 5m grounding session post-event" },
      { name: "Adrenaline Restrict (Caffeine)", type: "Dietary", trigger: "Zero caffeine intake 4 hours before speech/event" }
    ],
    cohortId: 42,
    cohortDescription: "Social and Performance anxiety cohort pod. Focuses on pre-event breathing buffers and post-event cognitive declutter milestones."
  },
  "Generalized Tension & Panic": {
    anxietyScore: 8.2,
    subtype: "Generalized Tension & Panic",
    symptoms: ["Somatic Restlessness", "Breathing dysregulation (Shallow)", "Jaw Clenching", "Sudden Panic Waves"],
    pacingRate: "50% Decelerated",
    adjustments: [
      { name: "Breathing Pacer (4-7-8)", type: "Somatic", trigger: "Trigger breathing break automatically every 3 hours" },
      { name: "Cold Sensory Grounding", type: "Sensory", trigger: "Apply cold water or ice pack on panic spike warnings" },
      { name: "Autonomic Pacing Breaks", type: "Interval", trigger: "Take 5m screen-free rest every 60m of continuous activity" }
    ],
    cohortId: 108,
    cohortDescription: "Generalized tension pod. Focusing on autonomic regulation, physical grounding checks, and panic cooldown workflows."
  },
  "Burnout & Attention Fatigue": {
    anxietyScore: 6.8,
    subtype: "Burnout & Attention Fatigue",
    symptoms: ["Cognitive Fatigue", "Attention Exhaustion", "Screen Aversion", "Pre-Sleep Restlessness"],
    pacingRate: "30% Decelerated",
    adjustments: [
      { name: "Digital Detach (9:30 PM)", type: "Digital", trigger: "Disable all digital communications at 9:30 PM" },
      { name: "Focus-Rest Interval (50-10)", type: "Workflow", trigger: "Strict 10m off-screen transition every 50m of work" },
      { name: "Physical Re-activation Stretch", type: "Physical", trigger: "Do a 5m full body stretch routine at 2:00 PM" }
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
    { name: "Mindful Pacing Pause", type: "Somatic", trigger: "Take a 5m breathing pause every 3 hours" },
    { name: "Evening Digital Boundary", type: "Digital", trigger: "Disconnect screens 60m before sleeping" }
  ],
  cohortId: 15,
  cohortDescription: "General behavioral pacing and stress management pod."
};

export async function POST(req: Request) {
  try {
    const { focusArea, ventText, answers } = await req.json();

    if (!focusArea) {
      return NextResponse.json({ error: "Missing focusArea" }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;

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
CalmPulse Clinical Pacing Methodology:
1. Social & Performance Anxiety: Structured cognitive pacing prior to events, caffeine restrictions (4 hours buffer before triggers), and post-stressor grounding intervals. Focused on "Social Receptive Index".
2. Generalized Tension & Panic: Somatic monitoring, vagus nerve breathing pacers (e.g. 4-7-8 cycles), cold-water sensory grounding, and interval breaks (5m screen-free rest every 60m of continuous activity). Focused on "Hyper-Arousal Hyper-Pacing" model.
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
3. symptoms: A list of 4 key cognitive/somatic symptoms identified from their responses.
4. pacingRate: A percentage decelerated pacing target (e.g., "45% Decelerated").
5. adjustments: An array of 3 custom behavioral habit adjustments matching the CalmPulse pacing guidelines for this subtype. Each adjustment should have a "name", "type" (e.g., Somatic, Digital, Workflow, Dietary), and a "trigger" (the explicit condition or schedule to perform it).
6. cohortId: A random integer between 10 and 150.
7. cohortDescription: A 2-sentence description of an anonymous cohort group of 5-8 peers facing similar symptoms and pacing goals.

Return ONLY a JSON object containing the report. Do not include markdown code block formatting.
Example format:
{
  "anxietyScore": 7.5,
  "subtype": "Generalized Tension & Panic",
  "symptoms": ["Somatic restlessness", "Jaw clenching"],
  "pacingRate": "45% Decelerated",
  "adjustments": [
    { "name": "Breathing break", "type": "Somatic", "trigger": "Triggered every 3 hours" }
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
  } catch (error: any) {
    console.error("Error in baseline API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
