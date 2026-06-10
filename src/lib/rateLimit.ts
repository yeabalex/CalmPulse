import { NextResponse } from "next/server";

type RateLimitOptions = {
  keyPrefix: string;
  limit: number;
  windowMs: number;
  maxBodyBytes?: number;
};

type Bucket = {
  count: number;
  resetAt: number;
};

const GLOBAL_LIMIT = 1000;
const GLOBAL_WINDOW_MS = 60 * 60 * 1000;
const buckets = new Map<string, Bucket>();

function getClientIp(req: Request) {
  if (process.env.TRUST_PROXY !== "true") {
    return "direct";
  }

  const forwardedFor = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "unknown";
}

function checkBucket(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (existing.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  existing.count += 1;
  return { allowed: true, remaining: limit - existing.count, resetAt: existing.resetAt };
}

function tooManyRequests(resetAt: number) {
  const retryAfter = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));

  return NextResponse.json(
    { error: "Too many requests. Please try again shortly." },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfter),
        "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
      },
    }
  );
}

export function applyRateLimit(req: Request, options: RateLimitOptions) {
  const contentLength = Number(req.headers.get("content-length") || 0);

  if (options.maxBodyBytes && contentLength > options.maxBodyBytes) {
    return NextResponse.json(
      { error: "Request body too large" },
      { status: 413 }
    );
  }

  const ip = getClientIp(req);
  const global = checkBucket(`global:${ip}`, GLOBAL_LIMIT, GLOBAL_WINDOW_MS);

  if (!global.allowed) {
    return tooManyRequests(global.resetAt);
  }

  const route = checkBucket(
    `${options.keyPrefix}:${ip}`,
    options.limit,
    options.windowMs
  );

  if (!route.allowed) {
    return tooManyRequests(route.resetAt);
  }

  return null;
}
