import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { verifyUnsubscribeToken } from '@/lib/unsubscribe';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  const parsed = token ? verifyUnsubscribeToken(token) : null;
  if (!parsed) {
    return NextResponse.redirect(new URL('/unsubscribed?status=invalid', request.url));
  }

  const { customerId, channel } = parsed;

  await ensureSchema();

  if (channel === 'sms') {
    await sql`UPDATE customers SET sms_opt_in = FALSE WHERE id = ${customerId}`;
  } else {
    await sql`UPDATE customers SET email_opt_in = FALSE WHERE id = ${customerId}`;
  }

  return NextResponse.redirect(
    new URL(`/unsubscribed?status=ok&channel=${channel}`, request.url)
  );
}
