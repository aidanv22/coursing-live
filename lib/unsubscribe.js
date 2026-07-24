import crypto from 'crypto';

function getSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET is not set on the server.');
  return secret;
}

// Unsubscribe tokens are deliberately non-expiring (an old email sitting in
// someone's inbox for a year should still be able to unsubscribe them) and
// scoped to a single customer + channel, so a leaked link can only ever
// unsubscribe that one person from that one channel.
export function generateUnsubscribeToken(customerId, channel) {
  const payload = `${customerId}.${channel}`;
  const signature = crypto
    .createHmac('sha256', getSecret())
    .update(payload)
    .digest('base64url');
  return Buffer.from(`${payload}.${signature}`).toString('base64url');
}

export function verifyUnsubscribeToken(token) {
  try {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [customerId, channel, signature] = decoded.split('.');
    if (!customerId || !channel || !signature) return null;

    const expected = crypto
      .createHmac('sha256', getSecret())
      .update(`${customerId}.${channel}`)
      .digest('base64url');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    return { customerId: Number(customerId), channel };
  } catch {
    return null;
  }
}
