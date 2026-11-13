/**
 * inquiry controller
 */

import { factories } from '@strapi/strapi';

const UID = 'api::inquiry.inquiry';

type InquiryService = {
  submit: (ip: string, body: unknown) => Promise<{ status: number; body: Record<string, unknown> }>;
  list: (
    ip: string,
    password: string,
    page: unknown,
    perPage: unknown
  ) => Promise<{ status: number; body: Record<string, unknown> }>;
};

export default factories.createCoreController(UID as any, ({ strapi }) => ({
  async submit(ctx) {
    const service = strapi.service(UID as any) as InquiryService;
    const result = await service.submit(ctx.ip, ctx.request.body);
    ctx.body = result.body;
    ctx.status = result.status;
  },

  async list(ctx) {
    const service = strapi.service(UID as any) as InquiryService;
    const result = await service.list(
      ctx.ip,
      ctx.get('x-inquiry-admin-password'),
      ctx.query.page,
      ctx.query.per_page
    );
    ctx.body = result.body;
    ctx.status = result.status;
  },
}));
