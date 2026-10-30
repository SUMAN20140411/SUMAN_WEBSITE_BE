import { localeOf, message, type Locale, type MessageKey } from './messages';

const PURPOSES = ['reference', 'quality', 'customer', 'other'] as const;
const RECEIVE_METHODS = ['visit', 'mail', 'electronic'] as const;
const SAMPLE_PHOTOS = ['attach', 'skip'] as const;
const SAMPLE_HANDLINGS = ['dispose', 'return'] as const;
const MAX_SPECS = 12;
const MAX_EQUIPMENT = 100;

export type IntakeData = {
  locale: Locale;
  equipmentIds: string[];
  sample: {
    sampleName: string;
    quantity: number;
    specs: { label: string; value: string }[];
  };
  report: {
    receptionType: 'general';
    purpose: (typeof PURPOSES)[number];
    purposeDetail: string;
    copyCount: number;
    receiveMethod: (typeof RECEIVE_METHODS)[number];
    shippingName: string;
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    deliveryAddress: string;
    addressDetail: string;
    samplePhoto: (typeof SAMPLE_PHOTOS)[number];
    sampleHandling: (typeof SAMPLE_HANDLINGS)[number];
  };
  client: {
    companyName: string;
    representativeName: string;
    businessRegistrationNumber: string;
    contactName: string;
    phone: string;
    email: string;
    companyPostalCode: string;
    address: string;
    companyAddressDetail: string;
    remarks: string;
  };
};

export type Failure = {
  ok: false;
  status: number;
  message: string;
};

export type ValidationResult = { ok: true; value: IntakeData } | Failure;

export function validateIntake(body: unknown): ValidationResult {
  const record = asRecord(body);
  const locale = localeOf(record.locale);
  const fail = (key: MessageKey): Failure => ({
    ok: false,
    status: 400,
    message: message(locale, key),
  });

  if (asText(record.website)) return fail('rejected');

  const equipmentIds = uniqueStrings(record.equipmentIds);
  if (equipmentIds.length < 1) return fail('equipmentRequired');
  if (equipmentIds.length > MAX_EQUIPMENT) return fail('tooLong');

  const sample = asRecord(record.sample);
  const report = asRecord(record.report);
  const client = asRecord(record.client);

  const sampleName = asText(sample.sampleName);
  if (!sampleName) return fail('sampleName');
  if (sampleName.length > 200) return fail('tooLong');

  if (isBlank(sample.quantity)) return fail('quantityRequired');
  const quantity = wholeNumber(sample.quantity);
  if (quantity === null) return fail('quantityInvalid');

  const specs = parseSpecs(sample.specs);
  if (!specs) return fail('specs');

  if (asText(report.receptionType) !== 'general') return fail('receptionType');

  const purpose = asText(report.purpose);
  if (!includes(PURPOSES, purpose)) return fail('purpose');
  const purposeDetail = asText(report.purposeDetail);
  if (purposeDetail.length > 200) return fail('tooLong');
  if (purpose === 'customer' && !purposeDetail) return fail('purposeDetail');

  if (isBlank(report.copyCount)) return fail('copyCountRequired');
  const copyCount = wholeNumber(report.copyCount);
  if (copyCount === null) return fail('copyCountInvalid');

  const receiveMethod = asText(report.receiveMethod);
  if (!includes(RECEIVE_METHODS, receiveMethod)) return fail('receiveMethod');

  const shippingName = asText(report.shippingName);
  const recipientName = asText(report.recipientName);
  const recipientPhone = asText(report.recipientPhone);
  const postalCode = asText(report.postalCode);
  const deliveryAddress = asText(report.deliveryAddress);
  const addressDetail = asText(report.addressDetail);
  if (
    exceeds(shippingName, 200) ||
    exceeds(recipientName, 200) ||
    exceeds(recipientPhone, 40) ||
    exceeds(postalCode, 10) ||
    exceeds(deliveryAddress, 300) ||
    exceeds(addressDetail, 200)
  ) {
    return fail('tooLong');
  }
  if (receiveMethod === 'mail') {
    if (!shippingName) return fail('shippingName');
    if (!recipientName) return fail('recipientName');
    if (!recipientPhone) return fail('recipientPhone');
    if (!postalCode) return fail('postalCode');
    if (!deliveryAddress) return fail('deliveryAddress');
    if (!addressDetail) return fail('addressDetail');
  }

  const samplePhoto = asText(report.samplePhoto);
  if (!includes(SAMPLE_PHOTOS, samplePhoto)) return fail('samplePhoto');
  const sampleHandling = asText(report.sampleHandling);
  if (!includes(SAMPLE_HANDLINGS, sampleHandling)) return fail('sampleHandling');

  const companyName = asText(client.companyName);
  if (!companyName) return fail('companyName');
  if (companyName.length > 200) return fail('tooLong');

  const representativeName = asText(client.representativeName);
  if (!representativeName) return fail('representativeName');
  if (representativeName.length > 200) return fail('tooLong');

  const businessRegistrationNumber = asText(client.businessRegistrationNumber);
  if (businessRegistrationNumber.length > 20) return fail('tooLong');
  if (!isBusinessRegistrationNumber(businessRegistrationNumber)) {
    return fail('businessNumberInvalid');
  }

  const contactName = asText(client.contactName);
  if (!contactName) return fail('contactName');
  if (contactName.length > 200) return fail('tooLong');

  const phone = asText(client.phone);
  if (!phone) return fail('phone');
  if (phone.length > 40) return fail('tooLong');
  if (!/^\d{2,4}-\d{3,4}-\d{4}$/.test(phone)) return fail('phoneInvalid');

  const email = asText(client.email);
  if (!email) return fail('emailRequired');
  if (email.length > 254) return fail('tooLong');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail('emailInvalid');

  const companyPostalCode = asText(client.companyPostalCode);
  if (!companyPostalCode) return fail('companyPostalCode');
  if (companyPostalCode.length > 10) return fail('tooLong');

  const address = asText(client.address);
  if (!address) return fail('address');
  if (address.length > 300) return fail('tooLong');

  const companyAddressDetail = asText(client.companyAddressDetail);
  if (companyAddressDetail.length > 200) return fail('tooLong');
  const remarks = asText(client.remarks);
  if (remarks.length > 300) return fail('tooLong');

  if (!isTrue(record.privacyConsent) || !isTrue(record.damageConsent)) {
    return fail('consentRequired');
  }

  return {
    ok: true,
    value: {
      locale,
      equipmentIds,
      sample: {
        sampleName,
        quantity,
        specs,
      },
      report: {
        receptionType: 'general',
        purpose,
        purposeDetail,
        copyCount,
        receiveMethod,
        shippingName: receiveMethod === 'mail' ? shippingName : '',
        recipientName: receiveMethod === 'mail' ? recipientName : '',
        recipientPhone: receiveMethod === 'mail' ? recipientPhone : '',
        postalCode: receiveMethod === 'mail' ? postalCode : '',
        deliveryAddress: receiveMethod === 'mail' ? deliveryAddress : '',
        addressDetail: receiveMethod === 'mail' ? addressDetail : '',
        samplePhoto,
        sampleHandling,
      },
      client: {
        companyName,
        representativeName,
        businessRegistrationNumber,
        contactName,
        phone,
        email,
        companyPostalCode,
        address,
        companyAddressDetail,
        remarks,
      },
    },
  };
}

function asRecord(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return {};
  return body as Record<string, unknown>;
}

function asText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function isBlank(value: unknown) {
  if (value === undefined || value === null) return true;
  return typeof value === 'string' && value.trim() === '';
}

function exceeds(value: string, max: number) {
  return value.length > max;
}

function isTrue(value: unknown) {
  return value === true || value === 'true';
}

function includes<T extends string>(values: readonly T[], value: string): value is T {
  return (values as readonly string[]).includes(value);
}

function uniqueStrings(value: unknown) {
  const source = Array.isArray(value) ? value : value === undefined || value === null ? [] : [value];
  const ids = source
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
  return [...new Set(ids)];
}

function wholeNumber(value: unknown) {
  const text = typeof value === 'number' ? String(value) : asText(value);
  if (!/^\d+$/.test(text)) return null;
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed < 1) return null;
  return parsed;
}

function isBusinessRegistrationNumber(value: string) {
  if (!value) return true;
  if (!/^[\d-]+$/.test(value)) return false;
  return /^\d{10}$/.test(value.replace(/-/g, ''));
}

function parseSpecs(value: unknown) {
  let parsed = value;
  if (typeof value === 'string') {
    if (!value.trim()) return [];
    try {
      parsed = JSON.parse(value);
    } catch {
      return null;
    }
  }
  if (parsed === undefined || parsed === null || parsed === '') return [];
  if (!Array.isArray(parsed) || parsed.length > MAX_SPECS) return null;

  const specs: { label: string; value: string }[] = [];
  for (const row of parsed) {
    if (!row || typeof row !== 'object') return null;
    const label = asText((row as { label?: unknown }).label);
    const specValue = asText((row as { value?: unknown }).value);
    if (!label || !specValue) return null;
    if (label.length > 200 || specValue.length > 2000) return null;
    specs.push({ label, value: specValue });
  }
  return specs;
}
