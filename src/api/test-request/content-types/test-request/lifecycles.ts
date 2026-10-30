import type { Core } from '@strapi/strapi';

const UID = 'api::test-request.test-request';
const LOCKED_FIELDS = [
  'receiptNo',
  'receipt_no',
  'accessPasswordHash',
  'access_password_hash',
];

function app() {
  return (global as { strapi: Core.Strapi }).strapi;
}

/**
 * Assigns a receipt number when an entry is created outside the intake route.
 * Receipt number and password hash stay fixed after create.
 */
export default {
  async beforeCreate(event) {
    const data = event.params?.data;
    if (!data) return;
    if (typeof data.receiptNo === 'string' && data.receiptNo.trim()) return;
    const service = app().service(UID) as { nextReceiptNo: () => Promise<string> };
    data.receiptNo = await service.nextReceiptNo();
  },

  beforeUpdate(event) {
    const data = event.params?.data;
    if (!data) return;
    LOCKED_FIELDS.forEach((field) => {
      delete data[field];
    });
  },
};
