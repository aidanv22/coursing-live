import { NextResponse } from 'next/server';
import { sql, ensureSchema } from '@/lib/db';
import { generatePasswordResetToken } from '@/lib/auth';
import { sendTransactionalEmail, appUrl } from '@/lib/senders';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
    }

    await ensureSchema();
    const rows = await sql`SELECT id, name FROM companies WHERE email = ${email.toLowerCase()}`;
    const company = rows[0];

    // Deliberately the same response whether or not an account exists — an
    // error message here would let someone probe which emails have
    // Coursing accounts.
    if (company) {
      const token = await generatePasswordResetToken(company.id);
      const resetUrl = `${appUrl()}/reset-password?token=${token}`;

      try {
        await sendTransactionalEmail({
          to: email,
          subject: 'Reset your Coursing password',
          body: `Hi ${company.name},\n\nSomeone requested a password reset for your Coursing account. If this was you, reset your password here:\n\n${resetUrl}\n\nThis link expires in 1 hour. If you didn't request this, you can safely ignore this email.\n\n— Coursing`,
        });
      } catch {
        // Swallow send failures too, for the same reason — don't leak
        // account existence via a differently-timed or differently-shaped
        // error response.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('forgot-password error:', err);
    return NextResponse.json({ ok: true }); // still don't leak details on error
  }
}
