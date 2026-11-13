const WINDOW_MS = 60 * 60 * 1000;
const LIMIT = 10;

const hits = new Map<string, number[]>();

function recent(key: string) {
  const now = Date.now();
  const stamps = (hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  hits.set(key, stamps);
  return stamps;
}

function keyFor(ip: string, route: string) {
  return `${route}:${ip || 'unknown'}`;
}

export function isHourlyLimited(ip: string, route: string) {
  return recent(keyFor(ip, route)).length >= LIMIT;
}

export function recordHourlyHit(ip: string, route: string) {
  const key = keyFor(ip, route);
  const stamps = recent(key);
  stamps.push(Date.now());
  hits.set(key, stamps);
}

/** Allows up to 10 hits per IP per route each hour. */
export function consumeHourlyLimit(ip: string, route: string) {
  if (isHourlyLimited(ip, route)) return false;
  recordHourlyHit(ip, route);
  return true;
}
