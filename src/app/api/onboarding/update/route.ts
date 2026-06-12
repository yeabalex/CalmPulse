import { NextResponse } from "next/server";
import { getCalmPulseDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { applyRateLimit } from "@/lib/rateLimit";
import { getGroqApiKey } from "@/lib/ai";
import { assignUserToPod } from "@/lib/pods";

export const runtime = "nodejs";

// Helper function to generate initial pacing activities dynamically based on goal, focusArea, report
async function generateInitialActivities(
  goal: string,
  focusArea: string,
  report: any,
  ventText: string
): Promise<Array<{ id: string; name: string; type: string; description: string; enabled: boolean; source: string }>> {
  const apiKey = getGroqApiKey();

  if (!apiKey) {
    // Heuristic fallbacks customized by Focus Area
    const somaticName = report?.adjustments?.[0]?.name || "Body Calm Breathing Pause";
    const somaticTrigger = report?.adjustments?.[0]?.trigger || "Take a 5m breathing pause every 3 hours";
    
    const digitalName = report?.adjustments?.[1]?.name || "Digital Screen Detach Boundary";
    const digitalTrigger = report?.adjustments?.[1]?.trigger || "Disconnect screens 30m prior to sleeping";

    if (focusArea === "Social & Performance Anxiety") {
      return [
        { id: "ai_act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Body Calm", description: "Uses slow breathing to ease a racing heartbeat before or after stress.", enabled: true, source: "ai" },
        { id: "ai_act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Gives your mind a quieter path into sleep.", enabled: true, source: "ai" },
        { id: "ai_act_3", name: "Caffeine restriction: Zero caffeine intake 4 hours before triggers", type: "Dietary", description: "Helps prevent caffeine from mimicking stress symptoms.", enabled: true, source: "ai" },
        { id: "ai_act_4", name: "Post-event grounding: Listen to 5m calming audio after meetings", type: "Auditory", description: "Eases replaying thoughts after hard moments.", enabled: true, source: "ai" },
        { id: "ai_act_5", name: "Pre-stressor focus: Do 3m mindful breathing in room before events", type: "Mindfulness", description: "Anchor attention in physical space to suppress anticipation loops.", enabled: true, source: "ai" }
      ];
    } else if (focusArea === "Generalized Tension" || focusArea === "Generalized Tension & Panic") {
      return [
        { id: "ai_act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Body Calm", description: "Uses slow breathing to lower body tension.", enabled: true, source: "ai" },
        { id: "ai_act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Creates a clear evening boundary to ease restlessness.", enabled: true, source: "ai" },
        { id: "ai_act_3", name: "Breathing cooldown: slow breaths during tension waves", type: "Body Calm", description: "A quick grounding step for rising stress.", enabled: true, source: "ai" },
        { id: "ai_act_4", name: "Cool grounding: Splash cool water or hold ice during stress waves", type: "Sensory", description: "Uses temperature to help your body shift gears.", enabled: true, source: "ai" },
        { id: "ai_act_5", name: "Screen-free rest: 5m every 60m of continuous desk work", type: "Interval", description: "Breaks long focus loops before stress builds.", enabled: true, source: "ai" }
      ];
    } else if (focusArea === "Burnout & Attention Fatigue") {
      return [
        { id: "ai_act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Body Calm", description: "Refreshes attention with a short breathing reset.", enabled: true, source: "ai" },
        { id: "ai_act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Provide a neurological transition boundary to support sleep cycle entry.", enabled: true, source: "ai" },
        { id: "ai_act_3", name: "Focus-Rest split: Strict 10m off-screen break every 50m of work", type: "Workflow", description: "Prevent neural burnout and eye fatigue by enforcing interval recovery.", enabled: true, source: "ai" },
        { id: "ai_act_4", name: "Physical re-activation: Do 5m full body stretch routine at 2:00 PM", type: "Physical", description: "Re-engage circulation and break physical fatigue loops mid-afternoon.", enabled: true, source: "ai" },
        { id: "ai_act_5", name: "Attention detox: Zero social media surfing during working hours", type: "Focus", description: "Limit high-dopamine inputs to restore baseline cognitive focus reserves.", enabled: true, source: "ai" }
      ];
    }

    // Default stress management
    return [
      { id: "ai_act_1", name: "Body Calm Breathing: 5m check-in every 4 hours", type: "Body Calm", description: "Keeps breathing breaks easy to remember.", enabled: true, source: "ai" },
      { id: "ai_act_2", name: "Digital Detach: Disconnect all screen syncs after 9:30 PM", type: "Digital", description: "Support biological melatonin release to improve deep sleep.", enabled: true, source: "ai" },
      { id: "ai_act_3", name: "Mindful Pacing Pause: Take a 5m reflection walk after lunch", type: "Workflow", description: "Ease mid-day stress accumulation through gentle physical pacing.", enabled: true, source: "ai" },
      { id: "ai_act_4", name: "Gratitude note: List 3 things that grounded you today", type: "Journaling", description: "Re-anchor emotional focus on positive somatic experiences.", enabled: true, source: "ai" },
      { id: "ai_act_5", name: "Sleep prep: Perform 10m progressive muscle relaxation in bed", type: "Sleep", description: "Relieve residual muscle tension to support deeper physical recovery.", enabled: true, source: "ai" }
    ];
  }

  // AI Generation using Groq
  try {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey: apiKey,
    });

    const prompt = `You are a plain-language pacing assistant for CalmPulse.
Generate a personalized daily pacing plan consisting of exactly 5 custom activities/habits for a user based on their goals and history.

USER METRICS:
- Selected Goal: "${goal}"
- Focus Area: "${focusArea}"
- Intake Symptoms: ${JSON.stringify(report?.symptoms || [])}
- Intake Vent: "${ventText || "None"}"
- Baseline recommended adjustments: ${JSON.stringify(report?.adjustments || [])}

Generate exactly 5 specific pacing activities. Each activity must have:
1. id: a string (e.g. "ai_act_1", "ai_act_2")
2. name: a clear description of the action and the specific trigger or time to do it (e.g. "Cold water splash: Splash cold water on face upon sensing jaw clenching triggers")
3. type: the type of activity (e.g. Body Calm, Digital, Mindfulness, Physical, Sleep, Dietary, Workflow, Focus)
4. description: a short one-sentence explanation in plain language of how it helps (e.g. "Slows breathing and helps the body settle.")
5. enabled: true
6. source: "ai"

Return ONLY a JSON array containing the activities. Do not include markdown code block formatting or other text.`;

    const response = await generateText({
      model: groq("llama-3.3-70b-versatile"),
      prompt,
    });

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

    const parsed = JSON.parse(text.trim());
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    throw new Error("Invalid output format");
  } catch (err) {
    console.error("Failed to generate AI initial activities, using fallback:", err);
    // Recursively call fallback by removing key to trigger static checks
    process.env.GROQ_API_KEY = "";
    const result = await generateInitialActivities(goal, focusArea, report, ventText);
    process.env.GROQ_API_KEY = apiKey; // restore
    return result;
  }
}

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "onboarding:update",
    limit: 240,
    windowMs: 60 * 60 * 1000,
    maxBodyBytes: 80 * 1024,
  });
  if (limited) return limited;

  try {
    const { userId, habits, syncTimes, notifications, onboardingComplete, goal, goalDuration } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const db = await getCalmPulseDb();

    // Convert string ID to ObjectId
    let oId: ObjectId;
    try {
      oId = new ObjectId(userId);
    } catch (err) {
      return NextResponse.json({ error: "Invalid userId format" }, { status: 400 });
    }

    // Fetch user for details if we are completing onboarding
    const user = await db.collection("users").findOne({ _id: oId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prepare update payload
    const updateDoc: any = {};
    if (habits !== undefined) updateDoc.habits = habits;
    if (syncTimes !== undefined) updateDoc.syncTimes = syncTimes;
    if (notifications !== undefined) updateDoc.notifications = notifications;
    if (onboardingComplete !== undefined) updateDoc.onboardingComplete = onboardingComplete;
    if (goal !== undefined) updateDoc.goal = goal;
    if (goalDuration !== undefined) updateDoc.goalDuration = goalDuration;

    // Generate initial pacing activities dynamically upon onboarding completion
    if (onboardingComplete === true) {
      const currentActivities = user.activities || [];
      if (currentActivities.length === 0) {
        const userGoal = goal || user.goal || "Reduce Anxiety in 90 Days";
        const userFocus = user.focusArea || "General";
        const userReport = user.calculatedReport || {};
        const userVent = user.ventText || "";
        
        const generatedActivities = await generateInitialActivities(
          userGoal,
          userFocus,
          userReport,
          userVent
        );
        updateDoc.activities = generatedActivities;
      }
    }

    await db.collection("users").updateOne(
      { _id: oId },
      { $set: updateDoc }
    );

    if (onboardingComplete === true) {
      const focusArea = user.focusArea || "General";
      await assignUserToPod(db, oId, focusArea);
    }

    return NextResponse.json({
      message: "Profile updated successfully",
      updated: true
    });
  } catch (error: any) {
    console.error("Error in onboarding update API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
