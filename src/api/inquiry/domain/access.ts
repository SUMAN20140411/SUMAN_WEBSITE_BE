import { timingSafeEqual } from 'node:crypto';

const MAX_PASSWORD_LENGTH = 200;

export function adminPasswordMatches(provided: string) {
  const expected = (process.env.INQUIRIES_ADMIN_PASSWORD ?? '').trim();
  const candidate = provided.trim();
  if (!expected || !candidate || candidate.length > MAX_PASSWORD_LENGTH) return false;

  const left = Buffer.from(candidate);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(left, left);
    return false;
  }
  return timingSafeEqual(left, right);
}
