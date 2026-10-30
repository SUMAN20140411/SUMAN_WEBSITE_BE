import { factories, type Core } from '@strapi/strapi';
import { message, localeOf } from '../domain/messages';
import { sendTestRequestEmails } from '../domain/notify';
import {
  DUMMY_PASSWORD_HASH,
  generatePassword,
  hashPassword,
  verifyPassword,
} from '../domain/password';
import { consumeRateLimit, type LimitedRoute } from '../domain/rate-limit';
import { counterFromReceipt, formatReceipt, seoulStamp } from '../domain/receipt';
import { validateIntake, type Failure, type IntakeData } from '../domain/validate';

const UID = 'api::test-request.test-request';
const EQUIPMENT_UID = 'api::test-equipment.test-equipment';
const CREATE_ATTEMPTS = 5;

type EquipmentRow = {
  documentId?: string;
  name?: string | null;
  locale?: string | null;
};

type SavedRequest = {
  documentId?: string;
  receiptNo?: string;
  status?: string;
  receivedDate?: string | Date | null;
  sample?: { sampleName?: string | null } | null;
  client?: { companyName?: string | null } | null;
  accessPasswordHash?: string | null;
};

export default factories.createCoreService(UID, ({ strapi }) => ({
  rateLimit(ip: string, route: LimitedRoute, locale: unknown) {
    if (consumeRateLimit(ip, route)) return null;
    return message(localeOf(locale), 'rateLimited');
  },

  async nextReceiptNo() {
    const { prefix } = seoulStamp();
    const rows = (await strapi.db.query(UID).findMany({
      where: { receiptNo: { $startsWith: prefix } },
      select: ['receiptNo'],
    })) as { receiptNo?: string }[];
    const max = rows.reduce(
      (highest, row) => Math.max(highest, counterFromReceipt(row.receiptNo || '', prefix)),
      0
    );
    return formatReceipt(prefix, max + 1);
  },

  async intake(body: unknown): Promise<{ ok: true; receiptNo: string } | Failure> {
    const validated = validateIntake(body);
    if (!validated.ok) {
      const failure = validated as Failure;
      return {
        ok: false,
        status: failure.status,
        message: failure.message,
      };
    }

    const equipment = await publishedEquipment(strapi, validated.value.equipmentIds);
    if (!equipment.ok) {
      return {
        ok: false,
        status: 400,
        message: message(validated.value.locale, 'equipmentUnknown'),
      };
    }

    const password = generatePassword();
    const passwordHash = hashPassword(password);
    const saved = await createRequest(strapi, validated.value, passwordHash);
    if (!saved.ok) return saved;

    await sendTestRequestEmails(strapi, {
      documentId: saved.documentId,
      receiptNo: saved.receiptNo,
      password,
      equipmentNames: equipment.names,
      data: validated.value,
    });

    return { ok: true, receiptNo: saved.receiptNo };
  },

  async status(body: unknown) {
    const record = asRecord(body);
    const locale = localeOf(record.locale);
    const receiptNo = typeof record.receiptNo === 'string' ? record.receiptNo.trim() : '';
    const password = typeof record.password === 'string' ? record.password : '';
    if (!receiptNo || !password.trim()) {
      return {
        ok: false as const,
        status: 400,
        message: message(locale, 'statusMissing'),
      };
    }

    const row = (await strapi.db.query(UID).findOne({
      where: { receiptNo },
      select: ['receiptNo', 'status', 'receivedDate', 'accessPasswordHash'],
      populate: {
        sample: true,
        client: true,
      },
    })) as SavedRequest | null;

    const matches = verifyPassword(password, row?.accessPasswordHash || DUMMY_PASSWORD_HASH);
    if (!row?.accessPasswordHash || !matches) {
      return {
        ok: false as const,
        status: 401,
        message: message(locale, 'statusAuth'),
      };
    }

    return {
      ok: true as const,
      value: {
        receiptNo: row.receiptNo,
        status: row.status,
        receivedDate: dateOnly(row.receivedDate),
        sampleName: row.sample?.sampleName,
        companyName: row.client?.companyName,
      },
    };
  },
}));

async function publishedEquipment(strapi: Core.Strapi, equipmentIds: string[]) {
  const rows = (await strapi.db.query(EQUIPMENT_UID).findMany({
    where: {
      documentId: { $in: equipmentIds },
      publishedAt: { $notNull: true },
    },
    select: ['documentId', 'name', 'locale'],
  })) as EquipmentRow[];

  const byId = new Map<string, EquipmentRow[]>();
  rows.forEach((row) => {
    if (!row.documentId) return;
    const list = byId.get(row.documentId) ?? [];
    list.push(row);
    byId.set(row.documentId, list);
  });

  const names: string[] = [];
  for (const id of equipmentIds) {
    const matches = byId.get(id);
    if (!matches?.length) return { ok: false as const };
    names.push(preferredName(matches) || id);
  }
  return { ok: true as const, names };
}

function preferredName(rows: EquipmentRow[]) {
  const ranked = [...rows].sort((left, right) => localeRank(left.locale) - localeRank(right.locale));
  return ranked.find((row) => row.name?.trim())?.name?.trim() || '';
}

function localeRank(locale?: string | null) {
  if (locale === 'ko-KR' || locale === 'ko') return 0;
  if (locale === 'en') return 1;
  return 2;
}

async function createRequest(
  strapi: Core.Strapi,
  value: IntakeData,
  passwordHash: string
): Promise<{ ok: true; receiptNo: string; documentId: string } | Failure> {
  const receivedDate = seoulStamp().iso;
  const receiptNumbers = strapi.service(UID) as { nextReceiptNo: () => Promise<string> };
  let lastError: unknown;
  for (let attempt = 0; attempt < CREATE_ATTEMPTS; attempt += 1) {
    const receiptNo = await receiptNumbers.nextReceiptNo();
    try {
      const created = await strapi.documents(UID).create({
        data: {
          receiptNo,
          accessPasswordHash: passwordHash,
          status: 'received',
          receivedDate,
          locale: value.locale,
          test_equipments: {
            connect: value.equipmentIds.map((documentId) => ({
              documentId,
              status: 'published',
            })),
          },
          sample: value.sample,
          report: value.report,
          client: value.client,
          privacyConsent: true,
          damageConsent: true,
        },
      });
      if (!created?.documentId || !created.receiptNo) {
        throw new Error('Test request was saved without a receipt number.');
      }
      return { ok: true, receiptNo: created.receiptNo, documentId: created.documentId };
    } catch (error) {
      lastError = error;
      if (isUniqueViolation(error) && attempt < CREATE_ATTEMPTS - 1) continue;
      break;
    }
  }

  strapi.log.error('Failed to save test request.');
  strapi.log.error(lastError);
  return {
    ok: false,
    status: 500,
    message: message(value.locale, 'saveFailed'),
  };
}

function isUniqueViolation(error: unknown) {
  return errorText(error).toLowerCase().includes('unique') || errorText(error).includes('23505');
}

function errorText(error: unknown) {
  const parts: string[] = [];
  const visit = (value: unknown, depth: number) => {
    if (!value || depth > 5) return;
    if (typeof value === 'string') {
      parts.push(value);
      return;
    }
    if (value instanceof Error) {
      parts.push(value.message);
      visit((value as Error & { cause?: unknown }).cause, depth + 1);
      return;
    }
    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      visit(record.message, depth + 1);
      visit(record.code, depth + 1);
      visit(record.error, depth + 1);
      visit(record.details, depth + 1);
    }
  };
  visit(error, 0);
  return parts.join(' ');
}

function asRecord(body: unknown) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body as Record<string, unknown>;
}

function dateOnly(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return seoulStamp(value).iso;
  }
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : '';
  }
  return '';
}
