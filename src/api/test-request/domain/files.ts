import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { message, type Locale, type MessageKey } from './messages';
import type { Failure } from './validate';

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_APPLICATION_FILES = 5;

export const BUSINESS_REG_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
]);

export const APPLICATION_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  '.hwp',
  '.hwpx',
  '.zip',
]);

export type UploadedTempFile = {
  filepath: string;
  originalFilename?: string | null;
  mimetype?: string | null;
  size: number;
};

export type PreparedUploadFile = {
  safeName: string;
  uploadFile: {
    filepath: string;
    originalFilename: string;
    mimetype: string;
    size: number;
  };
};

export type ValidatedFiles = {
  businessRegistrationFile: PreparedUploadFile;
  applicationFiles: PreparedUploadFile[];
};

const RESERVED_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;
const WINDOWS_RESERVED = /^(con|prn|aux|nul|com\d|lpt\d)$/i;

/**
 * Normalizes a multipart file field (single object, array, or undefined) into an array.
 */
export function normalizeTempFiles(raw: unknown): UploadedTempFile[] {
  const items = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const result: UploadedTempFile[] = [];
  for (const item of items) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    if (typeof record.filepath !== 'string' || !record.filepath) continue;
    const size = typeof record.size === 'number' && Number.isFinite(record.size) ? record.size : 0;
    const originalFilename =
      typeof record.originalFilename === 'string'
        ? record.originalFilename
        : typeof record.name === 'string'
          ? record.name
          : null;
    const mimetype =
      typeof record.mimetype === 'string'
        ? record.mimetype
        : typeof record.type === 'string'
          ? record.type
          : null;
    result.push({
      filepath: record.filepath,
      originalFilename,
      mimetype,
      size,
    });
  }
  return result;
}

/**
 * Produces a safe filename without path separators or OS-reserved names while preserving extension.
 */
export function sanitizeFilename(rawName: string | null | undefined, fallback: string): string {
  const normalized = (rawName || '').replace(/\\/g, '/');
  const baseWithExt = path.posix.basename(normalized).trim();
  const cleaned = baseWithExt.replace(RESERVED_CHARS, '_').trim();
  const ext = path.posix.extname(cleaned).toLowerCase();
  const rawBase = (ext ? cleaned.slice(0, -ext.length) : cleaned).replace(/\.+$/g, '').trim();

  let safeBase = rawBase || fallback;
  if (safeBase === '.' || safeBase === '..' || WINDOWS_RESERVED.test(safeBase)) {
    safeBase = `${fallback}_${safeBase.replace(/\./g, '') || 'file'}`;
  }

  const maxBaseLength = Math.max(1, 200 - ext.length);
  if (safeBase.length > maxBaseLength) {
    safeBase = safeBase.slice(0, maxBaseLength);
  }
  return `${safeBase}${ext}`;
}

function resolveMimeType(file: UploadedTempFile, safeName: string): string {
  const declared = (file.mimetype || '').trim().toLowerCase();
  if (declared && declared !== 'application/octet-stream') {
    return declared;
  }
  return mime.lookup(safeName) || 'application/octet-stream';
}

function validateFileEntry(
  file: UploadedTempFile,
  allowedExtensions: Set<string>,
  fallbackName: string,
  fail: (key: MessageKey) => Failure
): { ok: true; value: PreparedUploadFile } | Failure {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return fail('fileEmpty');
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return fail('fileTooLarge');
  }

  const safeName = sanitizeFilename(file.originalFilename, fallbackName);
  const ext = path.posix.extname(safeName).toLowerCase();
  if (!ext || !allowedExtensions.has(ext)) {
    return fail('fileTypeInvalid');
  }

  return {
    ok: true,
    value: {
      safeName,
      uploadFile: {
        filepath: file.filepath,
        originalFilename: safeName,
        mimetype: resolveMimeType(file, safeName),
        size: file.size,
      },
    },
  };
}

/**
 * Validates multipart upload files for business registration and optional application attachments.
 */
export function validateIntakeFiles(
  rawFiles: Record<string, unknown> | undefined,
  locale: Locale
): { ok: true; value: ValidatedFiles } | Failure {
  const fail = (key: MessageKey): Failure => ({
    ok: false,
    status: 400,
    message: message(locale, key),
  });

  const bizList = normalizeTempFiles(rawFiles?.businessRegistrationFile);
  if (bizList.length === 0) return fail('businessRegFileRequired');
  if (bizList.length > 1) return fail('businessRegFileTooMany');

  const bizChecked = validateFileEntry(
    bizList[0],
    BUSINESS_REG_EXTENSIONS,
    'business_registration',
    fail
  );
  if (!bizChecked.ok) return bizChecked as Failure;

  const appList = normalizeTempFiles(rawFiles?.applicationFiles);
  if (appList.length > MAX_APPLICATION_FILES) {
    return fail('applicationFilesTooMany');
  }

  const preparedApps: PreparedUploadFile[] = [];
  for (let index = 0; index < appList.length; index += 1) {
    const checked = validateFileEntry(
      appList[index],
      APPLICATION_EXTENSIONS,
      `application_${index + 1}`,
      fail
    );
    if (!checked.ok) return checked as Failure;
    preparedApps.push(checked.value);
  }

  return {
    ok: true,
    value: {
      businessRegistrationFile: bizChecked.value,
      applicationFiles: preparedApps,
    },
  };
}

/**
 * Deletes all temporary files parsed by koa-body/formidable across custom multipart field names.
 */
export async function cleanupTempFiles(rawFiles: Record<string, unknown> | undefined): Promise<void> {
  if (!rawFiles || typeof rawFiles !== 'object') return;
  const paths = new Set<string>();
  for (const fieldValue of Object.values(rawFiles)) {
    for (const file of normalizeTempFiles(fieldValue)) {
      if (file.filepath) paths.add(file.filepath);
    }
  }
  if (paths.size === 0) return;
  await Promise.allSettled([...paths].map((filepath) => fs.promises.rm(filepath, { force: true })));
}
