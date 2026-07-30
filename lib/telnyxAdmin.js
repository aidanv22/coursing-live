const BASE_URL = 'https://api.telnyx.com/v2/messaging_tollfree/verification/requests';

function requireApiKey() {
  if (!process.env.TELNYX_API_KEY) {
    throw new Error('Telnyx is not configured (missing TELNYX_API_KEY).');
  }
  return process.env.TELNYX_API_KEY;
}

async function telnyxFetch(path, options = {}) {
  const apiKey = requireApiKey();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...options.headers,
    },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const detail = data?.errors?.map((e) => e.detail || e.title).join('; ') || text || res.statusText;
    throw new Error(`Telnyx API error (${res.status}): ${detail}`);
  }

  return data;
}

// Every field Telnyx's Toll-Free Verification API accepts, per
// https://developers.telnyx.com/api/messaging/toll-free-verification/submit-verification-request
// Passed straight through — caller only needs to supply what's relevant.
const TFV_FIELDS = [
  'businessName', 'corporateWebsite', 'businessAddr1', 'businessAddr2', 'businessCity',
  'businessState', 'businessZip', 'businessContactFirstName', 'businessContactLastName',
  'businessContactEmail', 'businessContactPhone', 'messageVolume', 'phoneNumbers',
  'useCase', 'useCaseSummary', 'productionMessageContent', 'optInWorkflow',
  'optInWorkflowImageURLs', 'additionalInformation', 'isvReseller', 'webhookUrl',
  'businessRegistrationNumber', 'businessRegistrationType', 'businessRegistrationCountry',
  'entityType',
];

function pickTfvFields(data) {
  const out = {};
  for (const key of TFV_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

// Creates a brand-new TFV request. Reuses TELNYX_ISV_RESELLER_NAME as the
// default `isvReseller` value (Coursing, acting as the ISV/reseller for
// each business it submits a request on behalf of) unless the caller
// explicitly overrides it. Per Telnyx's docs, this field matters when the
// Telnyx account's domain doesn't match the business-being-registered's
// domain — leave it unset only when registering a number for your own
// direct use, not on behalf of a client business.
export async function createTollFreeVerification(data) {
  const fields = pickTfvFields(data);
  if (!fields.isvReseller && process.env.TELNYX_ISV_RESELLER_NAME) {
    fields.isvReseller = process.env.TELNYX_ISV_RESELLER_NAME;
  }
  return telnyxFetch('', { method: 'POST', body: JSON.stringify(fields) });
}

export async function listTollFreeVerifications() {
  const data = await telnyxFetch('');
  return data.records || data.data || [];
}

export async function getTollFreeVerification(id) {
  return telnyxFetch(`/${id}`);
}

// Telnyx's API does not currently expose an "edit in place" endpoint the
// way Twilio's did — per Telnyx's own docs, resubmitting a verification
// request for an already-verified number overwrites and re-verifies it
// rather than patching specific fields. The practical equivalent is:
// submit a new request with corrected fields (createTollFreeVerification),
// or delete the existing one first if it's stuck/rejected.
export async function deleteTollFreeVerification(id) {
  return telnyxFetch(`/${id}`, { method: 'DELETE' });
}
