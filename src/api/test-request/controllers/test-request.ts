/**
 * test-request controller
 */

import { factories } from '@strapi/strapi';
import { cleanupTempFiles } from '../domain/files';
import { localeOf, message } from '../domain/messages';
import type { Failure } from '../domain/validate';

const UID = 'api::test-request.test-request';

type TestRequestService = {
  rateLimit: (ip: string, route: 'intake' | 'status', locale: unknown) => string | null;
  intake: (
    body: unknown,
    files?: Record<string, unknown>
  ) => Promise<{ ok: true; receiptNo: string } | Failure>;
  status: (body: unknown) => Promise<
    | {
        ok: true;
        value: {
          receiptNo?: string;
          status?: string;
          receivedDate: string;
          sampleName?: string;
          companyName?: string;
        };
      }
    | Failure
  >;
};

export default factories.createCoreController(UID, ({ strapi }) => ({
  async intake(ctx) {
    const rawFiles = ctx.request.files as Record<string, unknown> | undefined;
    try {
      let payload: unknown = ctx.request.body;
      const bodyRecord = asRecord(ctx.request.body);
      if (typeof bodyRecord.data === 'string') {
        try {
          payload = JSON.parse(bodyRecord.data);
        } catch {
          ctx.status = 400;
          ctx.body = { message: message(localeOf(bodyRecord.locale), 'rejected') };
          return;
        }
      }

      const service = strapi.service(UID) as TestRequestService;
      const locale = asRecord(payload).locale ?? bodyRecord.locale;
      const limited = service.rateLimit(ctx.ip, 'intake', locale);
      if (limited) {
        ctx.status = 429;
        ctx.body = { message: limited };
        return;
      }

      const result = await service.intake(payload, rawFiles);
      if (!result.ok) {
        const failure = result as Failure;
        ctx.status = failure.status;
        ctx.body = { message: failure.message };
        return;
      }

      ctx.status = 201;
      ctx.body = { receiptNo: result.receiptNo };
    } finally {
      await cleanupTempFiles(rawFiles);
    }
  },

  async status(ctx) {
    const service = strapi.service(UID) as TestRequestService;
    const limited = service.rateLimit(ctx.ip, 'status', ctx.request.body?.locale);
    if (limited) {
      ctx.status = 429;
      ctx.body = { message: limited };
      return;
    }

    const result = await service.status(ctx.request.body);
    if (!result.ok) {
      const failure = result as Failure;
      ctx.status = failure.status;
      ctx.body = { message: failure.message };
      return;
    }

    ctx.status = 200;
    ctx.body = result.value;
  },
}));

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
