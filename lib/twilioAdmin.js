import twilio from 'twilio';

const client =
  process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
    ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
    : null;

function requireClient() {
  if (!client) throw new Error('Twilio is not configured (missing TWILIO_ACCOUNT_SID/AUTH_TOKEN).');
  return client;
}

// Every field the Twilio Toll-Free Verification API accepts, per
// https://www.twilio.com/docs/messaging/compliance/toll-free/api-onboarding
// Passed straight through — caller only needs to supply what's relevant.
const TFV_FIELDS = [
  'businessName', 'businessWebsite', 'notificationEmail', 'useCaseCategories',
  'useCaseSummary', 'productionMessageSample', 'optInImageUrls', 'optInType',
  'messageVolume', 'tollfreePhoneNumberSid', 'customerProfileSid',
  'businessStreetAddress', 'businessStreetAddress2', 'businessCity',
  'businessStateProvinceRegion', 'businessPostalCode', 'businessCountry',
  'additionalInformation', 'businessContactFirstName', 'businessContactLastName',
  'businessContactEmail', 'businessContactPhone', 'externalReferenceId',
  'businessRegistrationNumber', 'businessRegistrationAuthority',
  'businessRegistrationCountry', 'businessType', 'businessRegistrationPhoneNumber',
  'doingBusinessAs', 'optInConfirmationMessage', 'helpMessageSample',
  'privacyPolicyUrl', 'termsAndConditionsUrl', 'ageGatedContent', 'optInKeywords',
];

function pickTfvFields(data) {
  const out = {};
  for (const key of TFV_FIELDS) {
    if (data[key] !== undefined) out[key] = data[key];
  }
  return out;
}

// Creates a brand-new TFV request. Reuses TWILIO_ISV_CUSTOMER_PROFILE_SID as
// the default customerProfileSid (your approved ISV Primary Customer
// Profile) unless the caller explicitly overrides it — meaning once that
// profile is approved, submitting a new company's TFV request is just a
// matter of supplying that company's business details here.
export async function createTollFreeVerification(data) {
  const fields = pickTfvFields(data);
  if (!fields.customerProfileSid && process.env.TWILIO_ISV_CUSTOMER_PROFILE_SID) {
    fields.customerProfileSid = process.env.TWILIO_ISV_CUSTOMER_PROFILE_SID;
  }
  return requireClient().messaging.v1.tollfreeVerifications.create(fields);
}

export async function listTollFreeVerifications(filter = {}) {
  return requireClient().messaging.v1.tollfreeVerifications.list({ limit: 50, ...filter });
}

export async function getTollFreeVerification(sid) {
  return requireClient().messaging.v1.tollfreeVerifications(sid).fetch();
}

// Per Twilio's docs: only works while edit_allowed is true and before
// edit_expiration (7 days from the initial request) — check the fetched
// record's fields before calling this.
export async function editTollFreeVerification(sid, data, editReason) {
  const fields = pickTfvFields(data);
  if (editReason) fields.editReason = editReason;
  return requireClient().messaging.v1.tollfreeVerifications(sid).update(fields);
}

export async function deleteTollFreeVerification(sid) {
  return requireClient().messaging.v1.tollfreeVerifications(sid).remove();
}
