import type { Core } from '@strapi/strapi';
import type { IntakeData } from './validate';

type Notifier = Pick<Core.Strapi, 'plugin' | 'log'>;

export type RequestNotice = {
  documentId: string;
  receiptNo: string;
  password: string;
  equipmentNames: string[];
  data: IntakeData;
};

const PURPOSE_LABELS: Record<IntakeData['report']['purpose'], string> = {
  reference: '참고용',
  quality: '품질관리',
  customer: '거래처제출',
  other: '기타',
};

const RECEIVE_LABELS: Record<IntakeData['report']['receiveMethod'], string> = {
  visit: '방문',
  mail: '우송',
  electronic: '전자성적서',
};

let warnedMissingSite = false;
let warnedMissingManager = false;

export async function sendTestRequestEmails(strapi: Notifier, notice: RequestNotice) {
  const link = statusLink(notice.receiptNo, strapi);
  await sendRequesterEmail(strapi, notice, link);
  await sendManagerEmail(strapi, notice);
}

async function sendRequesterEmail(strapi: Notifier, notice: RequestNotice, link: string) {
  const english = notice.data.locale === 'en';
  const subject = english
    ? `[SUMAN] Test request received (${notice.receiptNo})`
    : `[수만] 시험 접수가 완료되었습니다 (${notice.receiptNo})`;
  const lines = english
    ? [
        'Your test request was received.',
        '',
        `Receipt number: ${notice.receiptNo}`,
        '',
        'Use the link below with this receipt number and password to check progress.',
        link || 'The progress page link is not configured yet.',
        '',
        `Password: ${notice.password}`,
        '',
        'This password is sent only in this email.',
      ]
    : [
        '시험 접수가 정상적으로 접수되었습니다.',
        '',
        `접수 번호: ${notice.receiptNo}`,
        '',
        '진행 상황은 아래 링크에서 접수 번호와 비밀번호로 확인할 수 있습니다.',
        link || '진행 확인 링크가 아직 설정되지 않았습니다.',
        '',
        `비밀번호: ${notice.password}`,
        '',
        '비밀번호는 이 메일에만 안내됩니다.',
      ];
  await deliver(strapi, {
    to: notice.data.client.email,
    subject,
    text: lines.join('\n'),
    receiptNo: notice.receiptNo,
  });
}

async function sendManagerEmail(strapi: Notifier, notice: RequestNotice) {
  const to = (process.env.TEST_CENTER_MANAGER_EMAIL || '').trim();
  if (!to) {
    if (!warnedMissingManager) {
      warnedMissingManager = true;
      strapi.log.warn(
        'TEST_CENTER_MANAGER_EMAIL is not set. Test request manager notifications are skipped.'
      );
    }
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    strapi.log.error('TEST_CENTER_MANAGER_EMAIL is not a valid email. Manager notification skipped.');
    return;
  }

  const { sample, report, client } = notice.data;
  const lines = [
    `접수 번호: ${notice.receiptNo}`,
    `업체명: ${client.companyName}`,
    `대표자명: ${client.representativeName}`,
    `담당자: ${client.contactName}`,
    `연락처: ${client.phone}`,
    `이메일: ${client.email}`,
    `시료명: ${sample.sampleName}`,
    `시료수: ${sample.quantity}`,
    `성적서 용도: ${PURPOSE_LABELS[report.purpose]}`,
    report.purposeDetail ? `제출처: ${report.purposeDetail}` : '',
    `수령방법: ${RECEIVE_LABELS[report.receiveMethod]}`,
    `시험 항목: ${notice.equipmentNames.join(', ') || '-'}`,
    '',
    `관리 화면: ${adminEntryUrl(notice.documentId)}`,
  ].filter((line) => line !== '');

  await deliver(strapi, {
    to,
    subject: `[시험 접수] ${notice.receiptNo} / ${client.companyName}`,
    text: lines.join('\n'),
    receiptNo: notice.receiptNo,
  });
}

async function deliver(
  strapi: Notifier,
  message: {
    to: string;
    subject: string;
    text: string;
    receiptNo: string;
  }
) {
  const host = (process.env.SMTP_HOST || '').trim();
  const from = (process.env.SMTP_DEFAULT_FROM || '').trim();
  if (!host || !from) {
    logSkipped(strapi, message, !host ? 'SMTP_HOST' : 'SMTP_DEFAULT_FROM');
    return;
  }

  try {
    await strapi.plugin('email').service('email').send({
      to: message.to,
      from,
      subject: message.subject,
      text: message.text,
      html: textToHtml(message.text),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    strapi.log.error(
      `Test request email for ${message.receiptNo} to ${message.to} failed: ${reason}`
    );
  }
}

function logSkipped(
  strapi: Notifier,
  message: {
    to: string;
    subject: string;
    text: string;
    receiptNo: string;
  },
  missing: string
) {
  if (process.env.NODE_ENV === 'production') {
    strapi.log.error(
      `Test request email for ${message.receiptNo} was not sent because ${missing} is not set.`
    );
    return;
  }
  strapi.log.info(
    `[test-request] ${missing} is unset. Email for ${message.receiptNo} was not sent.\nto: ${message.to}\nsubject: ${message.subject}\n${message.text}`
  );
}

function statusLink(receiptNo: string, strapi: Notifier) {
  const base = (process.env.PUBLIC_SITE_URL || '').trim().replace(/\/$/, '');
  if (!base) {
    if (!warnedMissingSite) {
      warnedMissingSite = true;
      strapi.log.warn('PUBLIC_SITE_URL is not set. Test request emails omit the progress link.');
    }
    return '';
  }
  try {
    const url = new URL('/test-center/status', `${base}/`);
    url.searchParams.set('receiptNo', receiptNo);
    return url.toString();
  } catch {
    strapi.log.warn('PUBLIC_SITE_URL is not a valid origin. Test request emails omit the progress link.');
    return '';
  }
}

function adminEntryUrl(documentId: string) {
  const configured = (process.env.STRAPI_PUBLIC_URL || '').trim().replace(/\/$/, '');
  const base = configured || `http://localhost:${process.env.PORT || 1337}`;
  return `${base}/admin/content-manager/collection-types/api::test-request.test-request/${documentId}`;
}

function textToHtml(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escaped}</pre>`;
}
