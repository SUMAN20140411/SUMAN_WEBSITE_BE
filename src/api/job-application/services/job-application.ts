import { readFile, rm, stat } from 'node:fs/promises';
import { factories, type Core } from '@strapi/strapi';
import { consumeHourlyLimit } from '../../../utils/hourly-rate-limit';
import { sendJobApplicationEmail } from '../domain/notify';
import { validateJob } from '../domain/validate';

const UID = 'api::job-application.job-application';
const CREATE_ROUTE = 'job-create';
const MAX_RESUME_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTS = new Set(['pdf', 'doc', 'docx', 'hwp']);

type StoredFile = { id?: number; provider?: string };
type JobRow = { id?: number | string; createdAt?: string | Date };

type UploadService = {
  upload(params: {
    data: { fileInfo?: { name?: string; alternativeText?: string } };
    files: unknown;
  }): Promise<StoredFile[] | StoredFile>;
  remove(file: StoredFile): Promise<unknown>;
};

type DocStore = {
  create(params: { data: Record<string, unknown> }): Promise<JobRow>;
};

type UploadFile = {
  filepath: string;
  originalFilename: string;
  mimetype: string;
  raw: Record<string, unknown>;
};

export type JobResult = {
  status: number;
  body: Record<string, unknown>;
};

export default factories.createCoreService(UID as any, ({ strapi }: { strapi: Core.Strapi }) => ({
  async submit(ip: string, body: unknown, fileInput: unknown): Promise<JobResult> {
    const validated = validateJob(body);
    const validationError = 'error' in validated ? validated.error : null;
    if (validationError === 'Spam detected') {
      return { status: 400, body: { ok: false, error: validationError } };
    }
    if (!consumeHourlyLimit(ip, CREATE_ROUTE)) {
      return { status: 429, body: { ok: false, error: 'Too many requests' } };
    }
    if (validationError || !validated.ok) {
      return { status: 400, body: { ok: false, error: validationError ?? 'Invalid application' } };
    }

    const file = asUploadFile(fileInput);
    if (!file) {
      return { status: 400, body: { ok: false, error: 'Resume file is required' } };
    }

    let uploaded: StoredFile | null = null;
    try {
      const extension = file.originalFilename.split('.').pop()?.toLowerCase() ?? '';
      if (!ALLOWED_EXTS.has(extension)) {
        return { status: 400, body: { ok: false, error: 'Invalid resume format' } };
      }

      let content: Buffer;
      try {
        const info = await stat(file.filepath);
        if (info.size <= 0 || info.size > MAX_RESUME_BYTES) {
          return { status: 400, body: { ok: false, error: 'Resume must be <= 5MB' } };
        }
        content = await readFile(file.filepath);
      } catch (error) {
        strapi.log.error('Failed to read resume upload.');
        strapi.log.error(error);
        return { status: 400, body: { ok: false, error: 'Upload failed' } };
      }
      if (content.length <= 0 || content.length > MAX_RESUME_BYTES) {
        return { status: 400, body: { ok: false, error: 'Resume must be <= 5MB' } };
      }

      const stored = await uploadService(strapi).upload({
        data: {
          fileInfo: {
            name: file.originalFilename,
            alternativeText: file.originalFilename,
          },
        },
        files: file.raw,
      });
      uploaded = Array.isArray(stored) ? stored[0] : stored;
      if (!uploaded?.id) throw new Error('Upload did not return a file id.');

      const created = await docs(strapi).create({
        data: {
          name: validated.value.name,
          email: validated.value.email,
          phone: validated.value.phone,
          position: validated.value.position,
          message: validated.value.message || null,
          resume: uploaded.id,
        },
      });

      const mailed = await sendJobApplicationEmail(strapi, validated.value, {
        filename: file.originalFilename,
        content,
        contentType: file.mimetype,
      });
      if (mailed === 'failed') {
        return { status: 500, body: { ok: false, error: 'Saved, but failed to email HR' } };
      }

      return {
        status: 201,
        body: {
          ok: true,
          id: numericId(created.id),
          createdAt: isoDate(created.createdAt),
        },
      };
    } catch (error) {
      strapi.log.error('Failed to save job application.');
      strapi.log.error(error);
      if (uploaded?.id) {
        try {
          await uploadService(strapi).remove(uploaded);
        } catch (removeError) {
          strapi.log.error(removeError);
        }
      }
      const message = error instanceof Error ? error.message : '';
      if (/mime|file type|not allowed/i.test(message)) {
        return { status: 400, body: { ok: false, error: 'Invalid resume file type' } };
      }
      return { status: 500, body: { ok: false, error: 'Failed to store resume' } };
    } finally {
      await rm(file.filepath, { force: true });
    }
  },
}));

function docs(strapi: Core.Strapi) {
  const documents = strapi.documents as unknown as (uid: string) => DocStore;
  return documents(UID);
}

function uploadService(strapi: Core.Strapi) {
  return strapi.plugin('upload').service('upload') as UploadService;
}

function asUploadFile(input: unknown): UploadFile | null {
  const candidate = Array.isArray(input) ? input[0] : input;
  if (!candidate || typeof candidate !== 'object') return null;
  const file = candidate as Record<string, unknown>;
  const filepath = text(file.filepath) || text(file.path);
  const originalFilename =
    text(file.originalFilename) || text(file.originalName) || text(file.name);
  const mimetype = text(file.mimetype) || text(file.type) || 'application/octet-stream';
  if (!filepath || !originalFilename) return null;
  file.filepath = filepath;
  file.originalFilename = originalFilename;
  file.mimetype = mimetype;
  return { filepath, originalFilename, mimetype, raw: file };
}

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
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
