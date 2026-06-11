import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import { applyRateLimit } from "@/lib/rateLimit";
import { getGroqApiKey } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "ai:reflection-submit",
    limit: 120,
    windowMs: 60 * 60 * 1000,
    maxBodyBytes: 80 * 1024,
  });
  if (limited) return limited;

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

    const body = await req.json();
    const { mood, energy, anxiety, sleep, ventText, clarifyingAnswers } = body;

    if (mood === undefined || anxiety === undefined || sleep === undefined) {
      return NextResponse.json({ error: "Missing required rating metrics" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const completedList = user.completedActivities || [];
    const activitiesCount = user.activities?.length || 5;
    const completionRate = activitiesCount > 0 ? (completedList.length / activitiesCount) * 100 : 0;

    // AI Recalibration context preparation
    const initialBaseline = user.calculatedReport || {};
    const priorLogs = user.dailyLogs ? user.dailyLogs.slice(-4) : [];
    const goal = user.goal || "Reduce Anxiety in 90 Days";

    const apiKey = getGroqApiKey();

    let baselineScore = anxiety; // default fallback
    let aiInsights = "Your daily log has been saved. Try checking off more activities tomorrow to accelerate your pacing score!";
    let redFlags: string[] = [];
    let updatedActivities = user.activities || [];

    // Simple mock heuristic calculations if API key is missing
    if (!apiKey) {
      // Logic-based Red Flag indicators
      if (sleep < 5) redFlags.push("Poor Sleep Pattern (Under 5 hrs)");
      if (anxiety > 8) redFlags.push("High Anxiety Threshold Spike");
      if (completionRate < 35) redFlags.push("Low Activity Pacing Compliance");
      if (priorLogs.length >= 2) {
        const lastSleep = priorLogs[priorLogs.length - 1].sleep || 7;
        const secondLastSleep = priorLogs[priorLogs.length - 2].sleep || 7;
        if (sleep < lastSleep && lastSleep < secondLastSleep) {
          redFlags.push("Declining Sleep Quality Trend");
        }
      }

      // Logic-based baseline recalibration
      const calculatedBaseline = (anxiety + (10 - sleep) + (10 - mood)) / 3;
      baselineScore = parseFloat(calculatedBaseline.toFixed(1));

      // Heuristic Pacing Updates
      if (anxiety > 7) {
        aiInsights = "Somatic warnings detected. We have added a critical cooling activity: Cold-water vagus nerve stimulation on panic triggers.";
        const hasTriggerTask = updatedActivities.some((a: any) => a.id === "ai_trigger_panic");
        if (!hasTriggerTask) {
          updatedActivities = [
            ...updatedActivities,
            { id: "ai_trigger_panic", name: "Cold sensory grounding on stress spikes", type: "Somatic", enabled: true, source: "ai" }
          ];
        }
      } else {
        aiInsights = "Your bio-regulation indicators are stabilizing nicely. Pacing intensity adjusted down by 5%. Focus on physical grounding walk.";
      }
    } else {
      // Query Groq to recalculate pacing parameters
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey: apiKey,
      });

      const prompt = `You are a clinical AI mental wellness coach for CalmPulse.
Analyze the user's daily check-in log and historical records to perform closed-loop pacing adaptation.

USER BLUEPRINT:
- Wellness Goal: "${goal}"
- Baseline Intake: ${JSON.stringify(initialBaseline)}

LOG DATA:
- Today's Ratings: Mood=${mood}/10, Energy=${energy}/10, Subjective Anxiety/Stress=${anxiety}/10, Sleep Quality=${sleep}/10 hrs.
- Today's Journal/Vent: "${ventText || "None"}"
- Clarifying QA Answers: ${JSON.stringify(clarifyingAnswers || {})}
- Checked Pacing Activities Today: ${JSON.stringify(completedList)} (out of ${activitiesCount} total)
- Activity Completion Rate: ${completionRate.toFixed(1)}%

PAST HISTORY (Prior logs):
${JSON.stringify(priorLogs)}

TASK:
1. Recalculate today's baselineScore (decimal between 1.0 and 10.0 indicating their recalculated anxiety/stress pacing baseline).
2. Detect positive/negative trends or risks ("redFlags"). Identify issues like declining sleep trends, missed activities, or consecutive bad mood journals. Return them as a list of short warning tags (e.g. "Missed Activities", "Declining Mood").
3. Generate updated "aiInsights": A supportive, clinical 2-3 sentence feedback summary with actionable advice.
4. Modify, remove, or introduce new pacing tasks based on their responses. Output the full modified list of active activities. Maintain their custom onboarding habits. Add new items with source: "ai".

Return ONLY a JSON object with this exact structure:
{
  "baselineScore": 6.8,
  "redFlags": ["Missed Activities", "Declining Sleep"],
  "aiInsights": "Insight text here...",
  "updatedActivities": [
     { "id": "act_breath", "name": "...", "type": "Somatic", "enabled": true },
     ...
  ]
}

Ensure the output is pure JSON. Do not include markdown code block formatting or other commentary.`;

      try {
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
        
        const result = JSON.parse(text.trim());
        if (result.baselineScore !== undefined) baselineScore = result.baselineScore;
        if (result.aiInsights) aiInsights = result.aiInsights;
        if (result.redFlags) redFlags = result.redFlags;
        if (result.updatedActivities) updatedActivities = result.updatedActivities;
      } catch (err) {
        console.error("Failed to parse Groq reflection analysis, falling back to heuristics:", err);
      }
    }

    // Prepare log document
    const newLog = {
      date: new Date(),
      mood,
      energy,
      anxiety,
      sleep,
      ventText,
      clarifyingAnswers,
      baselineScore,
      aiInsights,
      redFlags,
      completedCount: completedList.length
    };

    // Calculate Streak
    let newStreak = user.streak || 1;
    if (priorLogs.length > 0) {
      const lastLogDate = new Date(priorLogs[priorLogs.length - 1].date);
      const diffTime = Math.abs(new Date().getTime() - lastLogDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        // Logged in yesterday! Increment streak.
        newStreak += 1;
      } else if (diffDays > 1) {
        // Missed a day. Reset streak to 1.
        newStreak = 1;
      }
    }

    // Save permanently in MongoDB
    await db.collection("users").updateOne(
      { _id: userId },
      {
        $push: { dailyLogs: newLog },
        $set: {
          streak: newStreak,
          activities: updatedActivities,
          completedActivities: [], // Reset for next day
          lastActiveDate: todayStr
        }
      } as any
    );

    return NextResponse.json({
      success: true,
      message: "Daily Reflection saved successfully",
      newLog,
      streak: newStreak,
      activities: updatedActivities
    });
  } catch (error: any) {
    console.error("Error in reflection submit API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
