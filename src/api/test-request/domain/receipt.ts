export type SeoulStamp = {
  iso: string;
  prefix: string;
};

export function seoulStamp(now = new Date()): SeoulStamp {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = part(parts, 'year');
  const month = part(parts, 'month');
  const day = part(parts, 'day');
  return {
    iso: `${year}-${month}-${day}`,
    prefix: `CT${year.slice(-2)}-${month}${day}`,
  };
}

export function formatReceipt(prefix: string, counter: number) {
  return `${prefix}${String(counter).padStart(2, '0')}`;
}

export function counterFromReceipt(receiptNo: string, prefix: string) {
  if (!receiptNo.startsWith(prefix)) return 0;
  const counter = Number.parseInt(receiptNo.slice(prefix.length), 10);
  return Number.isFinite(counter) ? counter : 0;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((item) => item.type === type)?.value ?? '';
}
