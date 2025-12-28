type RateEntry = {
  count: number;
  windowStart: number;
};

const WINDOW_MS = 60_000;

const globalAny = global as any;
const cache: Map<string, RateEntry> = globalAny.__chatRateCache || new Map();
if (!globalAny.__chatRateCache) {
  globalAny.__chatRateCache = cache;
}

export function checkRateLimit(userId: string, limitPerMinute: number) {
  if (limitPerMinute <= 0) {
    return { ok: true, remaining: Infinity };
  }

  const now = Date.now();
  const entry = cache.get(userId);

  if (!entry || now - entry.windowStart >= WINDOW_MS) {
    cache.set(userId, { count: 1, windowStart: now });
    return { ok: true, remaining: Math.max(0, limitPerMinute - 1) };
  }

  if (entry.count >= limitPerMinute) {
    return { ok: false, remaining: 0 };
  }

  entry.count += 1;
  cache.set(userId, entry);
  return { ok: true, remaining: Math.max(0, limitPerMinute - entry.count) };
}








