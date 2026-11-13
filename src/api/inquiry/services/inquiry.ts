import { factories, type Core } from '@strapi/strapi';
import { isHourlyLimited, recordHourlyHit, consumeHourlyLimit } from '../../../utils/hourly-rate-limit';
import { adminPasswordMatches } from '../domain/access';
import { sendInquiryEmail } from '../domain/notify';
import { validateInquiry } from '../domain/validate';

const UID = 'api::inquiry.inquiry';
const CREATE_ROUTE = 'inquiry-create';
const LIST_AUTH_ROUTE = 'inquiry-list-auth';

type InquiryRow = {
  id?: number | string;
  createdAt?: string | Date;
  name?: string | null;
  affiliation?: string | null;
  contact?: string | null;
  email?: string | null;
  department?: string | null;
  message?: string | null;
};

type DocStore = {
  create(params: { data: Record<string, unknown> }): Promise<InquiryRow>;
  findMany(params: { sort?: string; start?: number; limit?: number }): Promise<InquiryRow[]>;
  count(params: Record<string, unknown>): Promise<number>;
};

export type InquiryResult = {
  status: number;
  body: Record<string, unknown>;
};

export default factories.createCoreService(UID as any, ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(ip: string, body: unknown): Promise<InquiryResult> {
    const validated = validateInquiry(body);
    const validationError = 'error' in validated ? validated.error : null;
    if (validationError === 'Spam detected') {
      return { status: 400, body: { ok: false, error: validationError } };
    }
    if (!consumeHourlyLimit(ip, CREATE_ROUTE)) {
      return { status: 429, body: { ok: false, error: 'Too many requests' } };
    }
    if (validationError || !validated.ok) {
      return { status: 400, body: { ok: false, error: validationError ?? 'Invalid inquiry' } };
    }

    try {
      const created = await docs(strapi).create({
        data: {
          name: validated.value.name,
          affiliation: validated.value.affiliation || null,
          contact: validated.value.contact,
          email: validated.value.email,
          department: validated.value.department,
          message: validated.value.message,
          language: validated.value.language || null,
        },
      });
      await sendInquiryEmail(strapi, validated.value);
      return {
        status: 201,
        body: {
          ok: true,
          id: numericId(created.id),
          createdAt: isoDate(created.createdAt),
        },
      };
    } catch (error) {
      strapi.log.error('Failed to save inquiry.');
      strapi.log.error(error);
      return { status: 500, body: { ok: false, error: 'Failed to save inquiry' } };
    }
  },

  async list(ip: string, password: string, pageRaw: unknown, perPageRaw: unknown): Promise<InquiryResult> {
    if (isHourlyLimited(ip, LIST_AUTH_ROUTE)) {
      return { status: 429, body: { ok: false, error: 'Too many requests' } };
    }
    if (!adminPasswordMatches(password)) {
      recordHourlyHit(ip, LIST_AUTH_ROUTE);
      return { status: 401, body: { ok: false, error: 'Incorrect password.' } };
    }

    const page = positiveInt(pageRaw, 1);
    const perPage = Math.min(positiveInt(perPageRaw, 5), 50);
    const store = docs(strapi);
    const [rows, total] = await Promise.all([
      store.findMany({
        sort: 'createdAt:desc',
        start: (page - 1) * perPage,
        limit: perPage,
      }),
      store.count({}),
    ]);
    const items = (Array.isArray(rows) ? rows : []).map((row) => ({
      id: numericId(row.id),
      name: row.name ?? '',
      contactMasked: row.contact ?? '',
      emailMasked: row.email ?? '',
      affiliationPreview: preview(row.affiliation ?? '', 60),
      department: row.department ?? '',
      messagePreview: preview(row.message ?? '', 120),
      createdAt: isoDate(row.createdAt),
    }));
    const count = typeof total === 'number' ? total : items.length;

    return {
      status: 200,
      body: {
        page,
        per_page: perPage,
        total: count,
        total_pages: Math.max(1, Math.ceil(count / perPage)),
        items,
      },
    };
  },
}));

function docs(strapi: Core.Strapi) {
  const documents = strapi.documents as unknown as (uid: string) => DocStore;
  return documents(UID);
}

function positiveInt(value: unknown, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number.parseInt(String(raw ?? ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function numericId(value: unknown) {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isoDate(value: unknown) {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string' && value) return value;
  return new Date().toISOString();
}

function preview(value: string, maxChars: number) {
  const plain = value.replace(/<[^>]*>/g, '').trim();
  const chars = Array.from(plain);
  if (chars.length <= maxChars) return plain;
  return `${chars.slice(0, maxChars).join('')}…`;
}
