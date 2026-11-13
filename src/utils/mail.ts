import type { Core } from '@strapi/strapi';

type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType?: string;
};

export type OutboundMail = {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
  attachments?: MailAttachment[];
  logLabel: string;
};

type EmailClient = {
  send: (options: Record<string, unknown>) => Promise<unknown>;
};

export async function deliverMail(
  strapi: Core.Strapi,
  message: OutboundMail
): Promise<'sent' | 'skipped' | 'failed'> {
  const host = (process.env.SMTP_HOST || '').trim();
  const from = (process.env.SMTP_DEFAULT_FROM || '').trim();
  if (!host || !from) {
    logSkipped(strapi, message, !host ? 'SMTP_HOST' : 'SMTP_DEFAULT_FROM');
    return 'skipped';
  }

  try {
    const email = strapi.plugin('email').service('email') as EmailClient;
    await email.send({
      to: message.to,
      from,
      replyTo: message.replyTo,
      subject: message.subject,
      text: message.text,
      html: textToHtml(message.text),
      attachments: message.attachments,
    });
    return 'sent';
  } catch (error) {
    const reason = error instanceof Error ? error.message : 'unknown error';
    strapi.log.error(`${message.logLabel} to ${message.to} failed: ${reason}`);
    return 'failed';
  }
}

function logSkipped(strapi: Core.Strapi, message: OutboundMail, missing: string) {
  if (process.env.NODE_ENV === 'production') {
    strapi.log.error(`${message.logLabel} was not sent because ${missing} is not set.`);
    return;
  }
  strapi.log.info(
    `[mail] ${missing} is unset. ${message.logLabel} was not sent.\nto: ${message.to}\nsubject: ${message.subject}\n${message.text}`
  );
}

function textToHtml(text: string) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<pre style="font-family: sans-serif; white-space: pre-wrap;">${escaped}</pre>`;
}
