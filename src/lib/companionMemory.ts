import { createOpenAI } from "@ai-sdk/openai";
import { generateText } from "ai";
import type { Db, ObjectId } from "mongodb";
import { getGroqApiKey, GROQ_COMPANION_MODEL } from "@/lib/ai";

const RAW_MESSAGE_LIMIT = 20;
const DURABLE_MEMORY_LIMIT = 40;
const COMPACT_BATCH_LIMIT = 25;
const STATE_COLLECTION = "companion_memory_state";
const DURABLE_COLLECTION = "companion_memories";

type MemoryStateType = "conversation" | "history";

interface CompanionMessageDoc {
  _id?: ObjectId;
  userId: string;
  userName: string;
  text: string;
  isOwn: boolean;
  createdAt: Date | string;
}

interface MemoryStateDoc {
  userId: string;
  type: MemoryStateType;
  summary: string;
  compactedThrough?: Date;
  updatedAt: Date;
}

interface DurableMemoryDoc {
  _id?: ObjectId;
  userId: string;
  text: string;
  type: string;
  source: string;
  confidence: number;
  createdAt: Date;
  updatedAt: Date;
}

interface DailyLog {
  date?: Date | string;
  mood?: number;
  energy?: number;
  anxiety?: number;
  sleep?: number;
  ventText?: string;
  baselineScore?: number;
  aiInsights?: string;
  redFlags?: string[];
  completedCount?: number;
}

interface BaselineReport {
  anxietyScore?: number;
  subtype?: string;
  symptoms?: string[];
  pacingRate?: string;
  adjustments?: Array<{
    name?: string;
    type?: string;
    trigger?: string;
  }>;
}

interface PacingActivity {
  id?: string;
  name?: string;
  type?: string;
  enabled?: boolean;
  source?: string;
}

interface UserMemoryDoc {
  _id?: ObjectId;
  name?: string;
  goal?: string;
  goalDuration?: number;
  focusArea?: string;
  ventText?: string;
  clarifyingAnswers?: unknown;
  calculatedReport?: BaselineReport;
  initialBaseline?: BaselineReport;
  habits?: unknown[];
  syncTimes?: unknown;
  notifications?: unknown;
  activities?: PacingActivity[];
  completedActivities?: string[];
  dailyLogs?: DailyLog[];
  streak?: number;
  lastActiveDate?: string;
}

interface ExtractedMemoryItem {
  type?: unknown;
  text?: unknown;
  confidence?: unknown;
}

export interface CompanionMemoryContext {
  profileMemory: string;
  currentStateMemory: string;
  historyMemory: string;
  conversationMemory: string;
  durableMemory: string;
  completedCount: number;
  totalCount: number;
  anxietyScore: number;
}

function compactJson(value: unknown): string {
  if (value === undefined || value === null) return "None";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function cleanText(value: unknown, fallback = "None"): string {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed || fallback;
}

function formatDate(value: Date | string | undefined): string {
  if (!value) return "unknown date";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown date";
  return date.toISOString().split("T")[0];
}

function average(values: number[]): number | null {
  if (values.length === 0) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function formatAverage(label: string, values: number[]): string | null {
  const avg = average(values);
  if (avg === null) return null;
  return `${label}: ${avg.toFixed(1)}/10`;
}

function buildProfileMemory(user: UserMemoryDoc | null): string {
  const report = user?.calculatedReport || user?.initialBaseline || {};
  const adjustments = Array.isArray(report.adjustments)
    ? report.adjustments.map((item) => ({
        name: item.name,
        type: item.type,
        trigger: item.trigger,
      }))
    : [];

  return [
    `Name: ${cleanText(user?.name, "Unknown")}`,
    `Goal: ${cleanText(user?.goal, "Reduce Anxiety & Regulate Sleep")}`,
    `Goal duration: ${user?.goalDuration || 90} days`,
    `Focus area: ${cleanText(user?.focusArea || report.subtype, "General")}`,
    `Baseline anxiety score: ${typeof report.anxietyScore === "number" ? report.anxietyScore.toFixed(1) : "unknown"}/10`,
    `Baseline symptoms: ${compactJson(report.symptoms || [])}`,
    `Baseline pacing rate: ${cleanText(report.pacingRate)}`,
    `Baseline adjustments: ${compactJson(adjustments)}`,
    `Initial intake vent: ${cleanText(user?.ventText)}`,
    `Initial clarifying answers: ${compactJson(user?.clarifyingAnswers)}`,
    `User custom habits: ${compactJson(user?.habits || [])}`,
    `Preferred sync times: ${compactJson(user?.syncTimes)}`,
    `Notification preferences: ${compactJson(user?.notifications)}`,
  ].join("\n");
}

function buildCurrentStateMemory(user: UserMemoryDoc | null): {
  text: string;
  completedCount: number;
  totalCount: number;
  anxietyScore: number;
} {
  const activities = Array.isArray(user?.activities) ? user.activities : [];
  const completedActivities = Array.isArray(user?.completedActivities) ? user.completedActivities : [];
  const logs = Array.isArray(user?.dailyLogs) ? user.dailyLogs : [];
  const latestLog: DailyLog | undefined = logs.at(-1);
  const report = user?.calculatedReport || {};
  const latestBaseline =
    typeof latestLog?.baselineScore === "number"
      ? latestLog.baselineScore
      : typeof latestLog?.anxiety === "number"
        ? latestLog.anxiety
        : typeof report.anxietyScore === "number"
          ? report.anxietyScore
          : 6.8;

  const activeActivities = activities.map((activity) => ({
    id: activity.id,
    name: activity.name,
    type: activity.type,
    enabled: activity.enabled !== false,
    source: activity.source || "default",
  }));

  return {
    completedCount: completedActivities.length,
    totalCount: activities.length,
    anxietyScore: latestBaseline,
    text: [
      `Today: ${completedActivities.length}/${activities.length} pacing activities completed.`,
      `Completed activity ids today: ${compactJson(completedActivities)}`,
      `Active activities: ${compactJson(activeActivities)}`,
      `Current/latest baseline score: ${Number(latestBaseline).toFixed(1)}/10`,
      `Current streak: ${user?.streak || 1}`,
      `Last active date: ${cleanText(user?.lastActiveDate)}`,
      `Latest red flags: ${compactJson(latestLog?.redFlags || [])}`,
      `Latest AI insight: ${cleanText(latestLog?.aiInsights)}`,
    ].join("\n"),
  };
}

function buildHistorySummary(logs: DailyLog[]): string {
  if (logs.length === 0) {
    return "No daily reflection history has been logged yet.";
  }

  const recent = logs.slice(-14);
  const latest = recent.at(-1);
  const redFlagCounts = new Map<string, number>();
  for (const log of recent) {
    for (const flag of log.redFlags || []) {
      redFlagCounts.set(flag, (redFlagCounts.get(flag) || 0) + 1);
    }
  }

  const topFlags = Array.from(redFlagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([flag, count]) => `${flag} (${count}x)`);

  const metrics = [
    formatAverage("Average mood", recent.flatMap((log) => (typeof log.mood === "number" ? [log.mood] : []))),
    formatAverage("Average energy", recent.flatMap((log) => (typeof log.energy === "number" ? [log.energy] : []))),
    formatAverage("Average anxiety", recent.flatMap((log) => (typeof log.anxiety === "number" ? [log.anxiety] : []))),
    formatAverage("Average sleep", recent.flatMap((log) => (typeof log.sleep === "number" ? [log.sleep] : []))),
  ].filter(Boolean);

  const latestLine = latest
    ? `Latest log ${formatDate(latest.date)}: anxiety=${latest.anxiety ?? "unknown"}, sleep=${latest.sleep ?? "unknown"}, completed=${latest.completedCount ?? "unknown"}, redFlags=${compactJson(latest.redFlags || [])}.`
    : "Latest log unavailable.";

  return [
    `Rolling wellness history covers ${recent.length} recent daily reflection(s).`,
    ...metrics,
    `Recurring red flags: ${topFlags.length ? topFlags.join(", ") : "none recorded"}`,
    latestLine,
  ].join("\n");
}

function formatLatestLog(log: DailyLog | undefined): string {
  if (!log) return "No latest raw daily log available.";
  return [
    `Date: ${formatDate(log.date)}`,
    `Mood: ${log.mood ?? "unknown"}/10`,
    `Energy: ${log.energy ?? "unknown"}/10`,
    `Anxiety: ${log.anxiety ?? "unknown"}/10`,
    `Sleep: ${log.sleep ?? "unknown"}/10`,
    `Baseline score: ${log.baselineScore ?? "unknown"}/10`,
    `Completed count: ${log.completedCount ?? "unknown"}`,
    `Red flags: ${compactJson(log.redFlags || [])}`,
    `Journal: ${cleanText(log.ventText)}`,
    `Insight: ${cleanText(log.aiInsights)}`,
  ].join("\n");
}

async function summarizeConversationOverflow(
  db: Db,
  userId: string,
  existingState: MemoryStateDoc | null,
  overflowMessages: CompanionMessageDoc[]
): Promise<MemoryStateDoc | null> {
  if (overflowMessages.length === 0) return existingState;

  const lastOverflowDate = new Date(overflowMessages[overflowMessages.length - 1].createdAt);
  const transcript = overflowMessages.map((message) => `${message.userName}: ${message.text}`).join("\n");
  const apiKey = getGroqApiKey();
  let summary = existingState?.summary || "";

  if (apiKey) {
    try {
      const groq = createOpenAI({
        baseURL: "https://api.groq.com/openai/v1",
        apiKey,
      });

      const response = await generateText({
        model: groq(GROQ_COMPANION_MODEL),
        prompt: `Update the rolling conversation state for a mental wellness pacing companion.

Existing rolling state:
${summary || "None yet."}

New messages that just aged out of the raw chat window:
${transcript}

Return a compact state summary under 180 words. Preserve user preferences, unresolved concerns, recurring triggers, and any commitments from the assistant. Do not add clinical diagnoses.`,
      });
      summary = response.text.trim();
    } catch (error) {
      console.error("Failed to update companion conversation state:", error);
    }
  }

  if (!summary) {
    summary = `Older conversation context: ${transcript.slice(0, 1200)}`;
  } else if (!apiKey) {
    summary = `${summary}\nOlder messages: ${transcript.slice(0, 800)}`.slice(-1800);
  }

  const updatedState: MemoryStateDoc = {
    userId,
    type: "conversation",
    summary,
    compactedThrough: lastOverflowDate,
    updatedAt: new Date(),
  };

  await db.collection<MemoryStateDoc>(STATE_COLLECTION).updateOne(
    { userId, type: "conversation" },
    { $set: updatedState },
    { upsert: true }
  );

  return updatedState;
}

async function loadConversationMemory(db: Db, userId: string): Promise<string> {
  const recentMessages = await db
    .collection<CompanionMessageDoc>("companion_messages")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(RAW_MESSAGE_LIMIT)
    .toArray();
  recentMessages.reverse();

  const oldestRecent = recentMessages[0];
  const existingState = await db
    .collection<MemoryStateDoc>(STATE_COLLECTION)
    .findOne({ userId, type: "conversation" });

  let state: MemoryStateDoc | null = existingState;
  if (oldestRecent) {
    const compactedThrough = existingState?.compactedThrough || new Date(0);
    const overflowMessages = await db
      .collection<CompanionMessageDoc>("companion_messages")
      .find({
        userId,
        createdAt: {
          $gt: compactedThrough,
          $lt: new Date(oldestRecent.createdAt),
        },
      })
      .sort({ createdAt: 1 })
      .limit(COMPACT_BATCH_LIMIT)
      .toArray();

    state = await summarizeConversationOverflow(db, userId, existingState, overflowMessages);
  }

  const rawTranscript = recentMessages.map((message) => `${message.userName}: ${message.text}`).join("\n");

  return [
    `Rolling conversation state for older messages:\n${state?.summary || "No older conversation state yet."}`,
    `Recent raw messages (${recentMessages.length}/${RAW_MESSAGE_LIMIT}):\n${rawTranscript || "No recent messages."}`,
  ].join("\n\n");
}

async function loadDurableMemory(db: Db, userId: string): Promise<string> {
  const memories = await db
    .collection<DurableMemoryDoc>(DURABLE_COLLECTION)
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(DURABLE_MEMORY_LIMIT)
    .toArray();

  if (memories.length === 0) return "No durable memories saved yet.";

  return memories
    .map((memory) => `- [${memory.type || "memory"}; ${memory.source || "unknown"}] ${memory.text}`)
    .join("\n");
}

export async function buildCompanionMemory(db: Db, userObjectId: ObjectId): Promise<CompanionMemoryContext> {
  const user = await db.collection<UserMemoryDoc>("users").findOne({ _id: userObjectId });
  const userId = userObjectId.toString();
  const logs = Array.isArray(user?.dailyLogs) ? user.dailyLogs : [];
  const historyState = await db
    .collection<MemoryStateDoc>(STATE_COLLECTION)
    .findOne({ userId, type: "history" });

  const currentState = buildCurrentStateMemory(user);

  return {
    profileMemory: buildProfileMemory(user),
    currentStateMemory: currentState.text,
    historyMemory: [
      `Rolling wellness summary:\n${historyState?.summary || buildHistorySummary(logs)}`,
      `Latest raw daily log:\n${formatLatestLog(logs.at(-1))}`,
    ].join("\n\n"),
    conversationMemory: await loadConversationMemory(db, userId),
    durableMemory: await loadDurableMemory(db, userId),
    completedCount: currentState.completedCount,
    totalCount: currentState.totalCount,
    anxietyScore: currentState.anxietyScore,
  };
}

export async function updateWellnessHistoryMemory(
  db: Db,
  userObjectId: ObjectId,
  logs: DailyLog[]
): Promise<void> {
  const userId = userObjectId.toString();
  const summary = buildHistorySummary(logs);
  await db.collection<MemoryStateDoc>(STATE_COLLECTION).updateOne(
    { userId, type: "history" },
    {
      $set: {
        userId,
        type: "history",
        summary,
        updatedAt: new Date(),
      },
    },
    { upsert: true }
  );
}

function parseJsonArray(text: string): unknown[] {
  let normalized = text.trim();
  if (normalized.startsWith("```json")) normalized = normalized.substring(7);
  if (normalized.startsWith("```")) normalized = normalized.substring(3);
  if (normalized.endsWith("```")) normalized = normalized.substring(0, normalized.length - 3);
  const parsed = JSON.parse(normalized.trim());
  return Array.isArray(parsed) ? parsed : [];
}

function isExtractedMemoryItem(value: unknown): value is ExtractedMemoryItem {
  return typeof value === "object" && value !== null;
}

function normalizeMemoryText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function memoryTokens(text: string): Set<string> {
  return new Set(normalizeMemoryText(text).split(" ").filter((token) => token.length > 2));
}

function isDuplicateMemory(candidate: string, existing: string): boolean {
  const normalizedCandidate = normalizeMemoryText(candidate);
  const normalizedExisting = normalizeMemoryText(existing);

  if (!normalizedCandidate || !normalizedExisting) return false;
  if (normalizedCandidate === normalizedExisting) return true;

  const candidateWords = normalizedCandidate.split(" ");
  if (candidateWords.length > 1 && normalizedExisting.includes(normalizedCandidate)) return true;
  if (candidateWords.length > 3 && normalizedCandidate.includes(normalizedExisting)) return true;

  const candidateTokens = memoryTokens(candidate);
  const existingTokens = memoryTokens(existing);
  if (candidateTokens.size < 2 || existingTokens.size < 2) return false;

  const sharedCount = Array.from(candidateTokens).filter((token) => existingTokens.has(token)).length;
  const overlap = sharedCount / Math.min(candidateTokens.size, existingTokens.size);
  return overlap >= 0.8;
}

async function compactDurableMemories(db: Db, userId: string, apiKey: string): Promise<void> {
  const memories = await db
    .collection<DurableMemoryDoc>(DURABLE_COLLECTION)
    .find({ userId })
    .sort({ updatedAt: 1 })
    .toArray();
  if (memories.length <= DURABLE_MEMORY_LIMIT) return;

  const overflowCount = memories.length - DURABLE_MEMORY_LIMIT + 5;
  const overflow = memories.slice(0, overflowCount);

  try {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });

    const response = await generateText({
      model: groq(GROQ_COMPANION_MODEL),
      prompt: `Summarize these durable user memories into one compact memory under 80 words.
Keep only stable preferences, triggers, constraints, and coping strategies. Do not invent facts.

${overflow.map((memory) => `- ${memory.text}`).join("\n")}

Return only the memory text.`,
    });

    await db.collection<DurableMemoryDoc>(DURABLE_COLLECTION).deleteMany({
      _id: { $in: overflow.flatMap((memory) => (memory._id ? [memory._id] : [])) },
    });

    const now = new Date();
    await db.collection<DurableMemoryDoc>(DURABLE_COLLECTION).insertOne({
      userId,
      text: response.text.trim().slice(0, 600),
      type: "summary",
      source: "ai_summary",
      confidence: 0.7,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error("Failed to compact durable companion memories:", error);
  }
}

export async function extractDurableMemoriesAfterChat(
  db: Db,
  userObjectId: ObjectId,
  userMessage: string,
  assistantMessage: string,
  context: CompanionMemoryContext
): Promise<void> {
  const apiKey = getGroqApiKey();
  if (!apiKey) return;

  const userId = userObjectId.toString();

  try {
    const groq = createOpenAI({
      baseURL: "https://api.groq.com/openai/v1",
      apiKey,
    });

    const response = await generateText({
      model: groq(GROQ_COMPANION_MODEL),
      prompt: `Extract durable memories from this CalmPulse companion exchange.

Existing durable memories:
${context.durableMemory}

User profile:
${context.profileMemory}

User message:
${userMessage}

Assistant response:
${assistantMessage}

Return ONLY a JSON array. Each item must have:
{ "type": "preference|trigger|coping_strategy|constraint|recurring_pattern", "text": "short stable memory", "confidence": 0.0-1.0 }

Only save stable, useful personalization facts. Return [] for one-off moods, generic statements, diagnoses, or private details unrelated to pacing.`,
    });

    const extracted = parseJsonArray(response.text)
      .filter(isExtractedMemoryItem)
      .map((item) => ({
        type: cleanText(item?.type, "memory").slice(0, 40),
        text: cleanText(item?.text, "").slice(0, 300),
        confidence: typeof item?.confidence === "number" ? Math.max(0, Math.min(1, item.confidence)) : 0.6,
      }))
      .filter((item) => item.text.length >= 12 && item.confidence >= 0.55)
      .slice(0, 5);

    if (extracted.length === 0) return;

    const existing = await db
      .collection<DurableMemoryDoc>(DURABLE_COLLECTION)
      .find({ userId })
      .project({ text: 1 })
      .toArray();
    const existingTexts = existing
      .map((memory) => cleanText(memory.text, ""))
      .filter(Boolean);
    const now = new Date();
    const pendingTexts: string[] = [];

    const docs = extracted
      .filter((item) => {
        const duplicate =
          existingTexts.some((text) => isDuplicateMemory(item.text, text)) ||
          pendingTexts.some((text) => isDuplicateMemory(item.text, text));
        if (!duplicate) pendingTexts.push(item.text);
        return !duplicate;
      })
      .map((item) => ({
        userId,
        text: item.text,
        type: item.type,
        source: "chat",
        confidence: item.confidence,
        createdAt: now,
        updatedAt: now,
      }));

    if (docs.length === 0) return;
    await db.collection<DurableMemoryDoc>(DURABLE_COLLECTION).insertMany(docs);

    const count = await db.collection<DurableMemoryDoc>(DURABLE_COLLECTION).countDocuments({ userId });
    if (count > DURABLE_MEMORY_LIMIT) {
      await compactDurableMemories(db, userId, apiKey);
    }
  } catch (error) {
    console.error("Failed to extract durable companion memories:", error);
  }
}
