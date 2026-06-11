export interface ActivityDetail {
  overview: string;
  howToDo: string;
  steps: string[];
  tips: string[];
  estimatedDuration: string;
}

const STORAGE_KEY = "calmpulse_activity_detail_cache_v2";
const TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEntry {
  detail: ActivityDetail;
  cachedAt: number;
}

type CacheStore = Record<string, CacheEntry>;

function readStore(): CacheStore {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CacheStore;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: CacheStore): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage full or unavailable — ignore
  }
}

export function pruneExpiredActivityDetails(): void {
  const store = readStore();
  const now = Date.now();
  let changed = false;

  for (const [id, entry] of Object.entries(store)) {
    if (!entry?.cachedAt || now - entry.cachedAt >= TTL_MS) {
      delete store[id];
      changed = true;
    }
  }

  if (changed) writeStore(store);
}

export function getCachedActivityDetail(activityId: string): ActivityDetail | null {
  pruneExpiredActivityDetails();
  const entry = readStore()[activityId];
  if (!entry?.detail || !entry.cachedAt || !entry.detail.howToDo) return null;
  if (Date.now() - entry.cachedAt >= TTL_MS) {
    removeCachedActivityDetail(activityId);
    return null;
  }
  return entry.detail;
}

export function setCachedActivityDetail(activityId: string, detail: ActivityDetail): void {
  const store = readStore();
  pruneExpiredActivityDetails();
  store[activityId] = { detail, cachedAt: Date.now() };
  writeStore(store);
}

export function removeCachedActivityDetail(activityId: string): void {
  const store = readStore();
  if (!store[activityId]) return;
  delete store[activityId];
  writeStore(store);
}
