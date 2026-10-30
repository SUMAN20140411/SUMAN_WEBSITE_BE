/**
 * test-request controller
 */

import { factories } from '@strapi/strapi';
import type { Failure } from '../domain/validate';

const UID = 'api::test-request.test-request';

type TestRequestService = {
  rateLimit: (ip: string, route: 'intake' | 'status', locale: unknown) => string | null;
  intake: (body: unknown) => Promise<{ ok: true; receiptNo: string } | Failure>;
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
    const service = strapi.service(UID) as TestRequestService;
    const limited = service.rateLimit(ctx.ip, 'intake', ctx.request.body?.locale);
    if (limited) {
      ctx.status = 429;
      ctx.body = { message: limited };
      return;
    }

    const result = await service.intake(ctx.request.body);
    if (!result.ok) {
      const failure = result as Failure;
      ctx.status = failure.status;
      ctx.body = { message: failure.message };
      return;
    }

    ctx.status = 201;
    ctx.body = { receiptNo: result.receiptNo };
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
