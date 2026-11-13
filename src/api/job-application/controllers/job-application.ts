/**
 * job-application controller
 */

import { factories } from '@strapi/strapi';

const UID = 'api::job-application.job-application';

type JobService = {
  submit: (
    ip: string,
    body: unknown,
    file: unknown
  ) => Promise<{ status: number; body: Record<string, unknown> }>;
};

export default factories.createCoreController(UID as any, ({ strapi }) => ({
  async submit(ctx) {
    const service = strapi.service(UID as any) as JobService;
    const files = (ctx.request as { files?: Record<string, unknown> }).files;
    const result = await service.submit(ctx.ip, ctx.request.body, files?.resume);
    ctx.body = result.body;
    ctx.status = result.status;
  },
}));
