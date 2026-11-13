import type { Core } from '@strapi/strapi';
import { deliverMail } from '../../../utils/mail';
import type { InquiryInput } from './validate';

const DEPARTMENT_EMAILS: Record<string, string> = {
  '영업 / 마케팅': 'bksik77@suman.co.kr',
  'Sales / Marketing': 'bksik77@suman.co.kr',
  '기술 / 개발': 'nsmyoung@suman.co.kr',
  'Technical / Develope': 'nsmyoung@suman.co.kr',
  '인사 / 총무': 'suman5713@suman.co.kr',
  'HR / General Affairs': 'suman5713@suman.co.kr',
  '기타 문의': 'suman20140411@suman.co.kr',
  'Other Inquiries': 'suman20140411@suman.co.kr',
};

const FALLBACK_EMAIL = 'suman20140411@suman.co.kr';

export async function sendInquiryEmail(strapi: Core.Strapi, inquiry: InquiryInput) {
  const to = DEPARTMENT_EMAILS[inquiry.department] || FALLBACK_EMAIL;
  const lines = ['새로운 문의가 접수되었습니다.', '', `이름: ${inquiry.name}`];
  if (inquiry.affiliation) lines.push(`소속: ${inquiry.affiliation}`);
  lines.push(`연락처: ${inquiry.contact}`);
  lines.push(`이메일: ${inquiry.email}`);
  lines.push(`문의 부서: ${inquiry.department}`);
  if (inquiry.language) lines.push(`언어: ${inquiry.language}`);
  lines.push('문의 내용:', inquiry.message);

  await deliverMail(strapi, {
    to,
    replyTo: inquiry.email,
    subject: '[SUMAN] 새로운 문의가 접수되었습니다',
    text: lines.join('\n'),
    logLabel: 'Inquiry email',
  });
}
