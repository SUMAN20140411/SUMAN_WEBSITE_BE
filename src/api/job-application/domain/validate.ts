export type JobInput = {
  name: string;
  email: string;
  phone: string;
  position: string;
  message: string;
};

export type JobValidation = { ok: true; value: JobInput } | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateJob(body: unknown): JobValidation {
  const record = asRecord(body);
  if (text(record.website) !== '') {
    return { ok: false, error: 'Spam detected' };
  }

  const name = text(record.name);
  const email = text(record.email);
  const phone = text(record.phone);
  const position = text(record.position);
  const message = text(record.message);

  if (!name || charLength(name) > 100) return { ok: false, error: 'Invalid name' };
  if (!email || charLength(email) > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Invalid email' };
  }
  if (!phone || charLength(phone) > 60) return { ok: false, error: 'Invalid phone' };
  if (!position || charLength(position) > 120) return { ok: false, error: 'Invalid position' };
  if (message && charLength(message) > 2000) return { ok: false, error: 'Invalid message' };

  return { ok: true, value: { name, email, phone, position, message } };
}

function asRecord(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body as Record<string, unknown>;
}

function text(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (typeof raw !== 'string') return '';
  return raw.replace(/\0/g, '').trim();
}

function charLength(value: string) {
  return Array.from(value).length;
}
