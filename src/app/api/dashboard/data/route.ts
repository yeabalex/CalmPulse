import { NextResponse } from "next/server";
import { getCurrentUserObjectId } from "@/lib/auth";
import { getCalmPulseDb } from "@/lib/mongodb";
import { applyRateLimit } from "@/lib/rateLimit";
import { ensureUserPod, getPodSummary } from "@/lib/pods";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const limited = applyRateLimit(req, {
    keyPrefix: "dashboard:data",
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

    const user = await db.collection("users").findOne({ _id: userId });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 1. Calculate Day Counter
    const createdDate = user.createdAt ? new Date(user.createdAt) : new Date();
    const diffTime = Math.abs(Date.now() - createdDate.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const goalDuration = user.goalDuration || 90;
    const currentDay = Math.min(diffDays, goalDuration);

    // 2. Fetch or Initialize dynamic pacing activities
    let activitiesList = user.activities || [];

    if (activitiesList.length === 0) {
      const focusArea = user.focusArea || "General";
      const report = user.calculatedReport || {};
      
      const somaticName = report.adjustments?.[0]?.name || "Somatic Breathing Pause";
      const somaticTrigger = report.adjustments?.[0]?.trigger || "Take a 5m pause every 3 hours";
      
      const digitalName = report.adjustments?.[1]?.name || "Screen Detach Boundary";
      const digitalTrigger = report.adjustments?.[1]?.trigger || "Turn off screens 30m prior to sleep";

      if (focusArea === "Social & Performance Anxiety") {
        activitiesList = [
          { id: "act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Somatic", description: "Stimulates the vagus nerve to slow down racing heartbeat pre-events.", enabled: true },
          { id: "act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Quiets autonomic nervous system stimulation to improve pre-sleep transition.", enabled: true },
          { id: "act_3", name: "Caffeine limit: No caffeine 4 hours before speaking stress", type: "Dietary", description: "Controls background adrenaline thresholds to keep somatic panic markers low.", enabled: true },
          { id: "act_4", name: "Grounding stretch: 5m chest expansion stretches before meetings", type: "Physical", description: "Opens up posture and breathing pathways to mitigate hyper-arousal.", enabled: true },
          { id: "act_5", name: "Post-event journaling: Write 3 positive outcomes after stressors", type: "Journaling", description: "Trains cognitive pathways to focus on positive reality anchors.", enabled: true }
        ];
      } else if (focusArea === "Generalized Tension & Panic") {
        activitiesList = [
          { id: "act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Somatic", description: "Downregulates baseline autonomic tension and balances breath pace.", enabled: true },
          { id: "act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Restricts blue light to allow natural sleep architecture activation.", enabled: true },
          { id: "act_3", name: "Autonomic transition: 5m screen-free rest every 60m of computer work", type: "Interval", description: "Resets neurological sensory accumulation and posturing stress.", enabled: true },
          { id: "act_4", name: "Vagus nerve cooldown: 4-7-8 breathing session on tightness signs", type: "Somatic", description: "Activates parasympathetic brake to quickly reduce sudden panic signals.", enabled: true },
          { id: "act_5", name: "Sensory cold shock: Apply cold pack to chest on heart rate warnings", type: "Sensory", description: "Uses temperature transition to override autonomic hyper-arousal spikes.", enabled: true }
        ];
      } else if (focusArea === "Burnout & Attention Fatigue") {
        activitiesList = [
          { id: "act_1", name: `${somaticName}: ${somaticTrigger}`, type: "Somatic", description: "Re-oxygenates brain cells to mitigate physical mental sluggishness.", enabled: true },
          { id: "act_2", name: `${digitalName}: ${digitalTrigger}`, type: "Digital", description: "Establishes a strict offline boundary to clear screen-induced stress.", enabled: true },
          { id: "act_3", name: "Focus pace: Strict 10m offline walk every 50m of coding", type: "Workflow", description: "Protects attention reserves by preventing prolonged visual strain.", enabled: true },
          { id: "act_4", name: "Physical re-activation: Do a 5m stretch sequence at 2:00 PM", type: "Physical", description: "Stimulates full-body circulation to counter mid-day concentration drop.", enabled: true },
          { id: "act_5", name: "Attention boundary: Block distracting tabs during focus blocks", type: "Focus", description: "Restores cognitive control by limiting multitasking dopamine hooks.", enabled: true }
        ];
      } else {
        activitiesList = [
          { id: "act_1", name: "Somatic breathing pause: 5m slow breaths every 4 hours", type: "Somatic", description: "Maintains regular bio-regulatory breathing cycles.", enabled: true },
          { id: "act_2", name: "Digital Detach: Disconnect screens after 9:30 PM", type: "Digital", description: "Allows full pre-sleep decompression and melatonin release.", enabled: true },
          { id: "act_3", name: "Workflow pacing: Take a 10m off-screen rest every 2 hours", type: "Workflow", description: "Restores sensory focus by interrupting continuous task pressure.", enabled: true },
          { id: "act_4", name: "Gratitude reflection: Note 3 positive anchors at end of day", type: "Journaling", description: "Re-calibrates emotional perspective before heading to sleep.", enabled: true },
          { id: "act_5", name: "Vagus nerve activation: Do 5m humming breathing in the morning", type: "Somatic", description: "Vibrational somatic check-in to establish early vagal balance.", enabled: true }
        ];
      }
      
      // Save this dynamic baseline list back to the user document
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: { activities: activitiesList } }
      );
    }

    // Check if user completed list has changed date
    const todayStr = new Date().toISOString().split("T")[0];
    let completedList = user.completedActivities || [];
    const lastActiveDate = user.lastActiveDate || "";

    if (lastActiveDate !== todayStr) {
      // It's a new day! Reset completed activities in database
      completedList = [];
      await db.collection("users").updateOne(
        { _id: userId },
        { $set: { completedActivities: [], lastActiveDate: todayStr } }
      );
    }

    // 3. Build Weekly Progress Chart from real dailyLogs only
    const weeklyProgress: Array<{
      dayName: string;
      date: string;
      anxietyScore: number | null;
      sleepQuality: number | null;
      hasData: boolean;
    }> = [];
    const logs = user.dailyLogs || [];

    const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dStr = d.toISOString().split("T")[0];
      const matchingLog = logs.find((l: { date?: Date | string }) =>
        l.date && new Date(l.date).toISOString().startsWith(dStr)
      );

      if (matchingLog) {
        const score = matchingLog.baselineScore ?? matchingLog.anxiety ?? null;
        const sleep = matchingLog.sleep ?? null;
        weeklyProgress.push({
          dayName: weekdays[d.getDay()],
          date: dStr,
          anxietyScore: score != null ? parseFloat(Number(score).toFixed(1)) : null,
          sleepQuality: sleep != null ? parseFloat(Number(sleep).toFixed(1)) : null,
          hasData: score != null,
        });
      } else {
        weeklyProgress.push({
          dayName: weekdays[d.getDay()],
          date: dStr,
          anxietyScore: null,
          sleepQuality: null,
          hasData: false,
        });
      }
    }

    const weeklyDataPointCount = weeklyProgress.filter((p) => p.hasData).length;

    // 3b. Load real cohort pod data
    let pod = null;
    const podObjectId = await ensureUserPod(db, userId);
    if (podObjectId) {
      pod = await getPodSummary(db, podObjectId, userId);
    }

    // 4. Seeding Default Achievements
    const achievements = [
      { id: "ach_onb", title: "Milestone Sync", desc: "Successfully aligned with an anonymous peer pod.", unlocked: true },
      { id: "ach_streak", title: "Habit Anchor", desc: "Maintained a continuous daily check-in streak.", unlocked: diffDays > 3 },
      { id: "ach_intake", title: "Venting Release", desc: "Expressed emotional symptoms via raw baseline logs.", unlocked: true }
    ];

    // 5. Seeding Default Insights & Warnings
    let insights = "Welcome to CalmPulse! Complete your daily activities above and check in using the 'End-of-Day Reflection' at night to let the AI recalculate your pacing baseline.";
    let redFlags: string[] = [];

    if (logs.length > 0) {
      const lastLog = logs[logs.length - 1];
      insights = lastLog.aiInsights || insights;
      redFlags = lastLog.redFlags || [];
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id.toString(),
        name: user.name,
        email: user.email,
        goal: user.goal || "Reduce Anxiety in 90 Days",
        goalDuration: goalDuration,
        currentDay: currentDay,
        streak: user.streak || 1,
        activities: activitiesList,
        completedActivities: completedList,
        weeklyProgress,
        weeklyDataPointCount,
        pod,
        achievements,
        insights,
        redFlags,
        report: user.calculatedReport || null
      }
    });
  } catch (error: any) {
    console.error("Error in dashboard data API:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 }
    );
  }
}
