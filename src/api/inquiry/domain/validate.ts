export type InquiryInput = {
  name: string;
  affiliation: string;
  contact: string;
  email: string;
  department: string;
  message: string;
  language: string;
};

export type InquiryValidation =
  | { ok: true; value: InquiryInput }
  | { ok: false; error: string };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateInquiry(body: unknown): InquiryValidation {
  const record = asRecord(body);
  if (text(record.website) !== '') {
    return { ok: false, error: 'Spam detected' };
  }

  const name = text(record.name);
  const affiliation = text(record.affiliation);
  const contact = text(record.contact);
  const email = text(record.email);
  const department = text(record.department);
  const message = text(record.message);
  const language = text(record.language);

  if (!name || charLength(name) > 100) return { ok: false, error: 'Invalid name' };
  if (affiliation && charLength(affiliation) > 120) {
    return { ok: false, error: 'Invalid affiliation' };
  }
  if (!contact || charLength(contact) > 60) return { ok: false, error: 'Invalid contact' };
  if (!email || charLength(email) > 254 || !EMAIL_PATTERN.test(email)) {
    return { ok: false, error: 'Invalid email' };
  }
  if (!department || charLength(department) > 120) {
    return { ok: false, error: 'Invalid department' };
  }
  if (!message || charLength(message) > 2000) return { ok: false, error: 'Invalid message' };
  if (language && charLength(language) > 16) return { ok: false, error: 'Invalid language' };

  return {
    ok: true,
    value: { name, affiliation, contact, email, department, message, language },
  };
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
