import type { Core } from '@strapi/strapi';
import { deliverMail } from '../../../utils/mail';
import type { JobInput } from './validate';

const HR_EMAIL = 'suman20140411@suman.co.kr';

type ResumeAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export function sendJobApplicationEmail(
  strapi: Core.Strapi,
  application: JobInput,
  resume: ResumeAttachment
) {
  const lines = [
    'A new job application was submitted.',
    '',
    `Name: ${application.name}`,
    `Email: ${application.email}`,
    `Phone: ${application.phone}`,
    `Position: ${application.position}`,
  ];
  if (application.message) {
    lines.push('', 'Message:', application.message);
  }

  return deliverMail(strapi, {
    to: HR_EMAIL,
    replyTo: application.email,
    subject: `[SUMAN] New Job Application - ${oneLine(application.position)}`,
    text: lines.join('\n'),
    attachments: [
      {
        filename: resume.filename,
        content: resume.content,
        contentType: resume.contentType,
      },
    ],
    logLabel: 'Job application email',
  });
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, ' ').slice(0, 120);
}
