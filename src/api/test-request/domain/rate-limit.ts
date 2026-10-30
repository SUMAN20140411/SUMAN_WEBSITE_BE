const WINDOW_MS = 10 * 60 * 1000;
const LIMITS = {
  intake: 30,
  status: 10,
} as const;

const hits = new Map<string, number[]>();

export type LimitedRoute = keyof typeof LIMITS;

export function consumeRateLimit(ip: string, route: LimitedRoute) {
  const key = `${route}:${ip || 'unknown'}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= LIMITS[route]) {
    hits.set(key, recent);
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}
