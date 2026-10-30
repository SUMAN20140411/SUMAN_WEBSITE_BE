import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const KEY_LENGTH = 32;

export function generatePassword(length = 8) {
  const bytes = randomBytes(length);
  let password = '';
  for (let index = 0; index < length; index += 1) {
    password += ALPHABET[bytes[index] % ALPHABET.length];
  }
  return password;
}

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const derived = scryptSync(password, salt, KEY_LENGTH);
  return `${salt}:${derived.toString('hex')}`;
}

export function verifyPassword(password: string, stored: string) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;
  const derived = scryptSync(password, salt, KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');
  if (expected.length !== derived.length) return false;
  return timingSafeEqual(derived, expected);
}

/** Used when no row exists so the failure path still runs a hash compare. */
export const DUMMY_PASSWORD_HASH = hashPassword(randomBytes(16).toString('hex'));
