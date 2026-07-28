import { NextResponse } from 'next/server';
import { getCurrentCompany } from '@/lib/auth';
import { listTollFreeVerifications, createTollFreeVerification } from '@/lib/twilioAdmin';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const company = await getCurrentCompany();
  if (!company) return { error: NextResponse.json({ error: 'Not logged in.' }, { status: 401 }) };
  if (!company.is_platform_admin) {
    return { error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }) };
  }
  return { company };
}

export async function GET() {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const verifications = await listTollFreeVerifications();
    return NextResponse.json({
      verifications: verifications.map((v) => ({
        sid: v.sid,
        businessName: v.businessName,
        status: v.status,
        tollfreePhoneNumberSid: v.tollfreePhoneNumberSid,
        rejectionReasons: v.rejectionReasons,
        editAllowed: v.editAllowed,
        editExpiration: v.editExpiration,
        dateCreated: v.dateCreated,
        dateUpdated: v.dateUpdated,
      })),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function POST(request) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const body = await request.json();
    const verification = await createTollFreeVerification(body);
    return NextResponse.json({ ok: true, sid: verification.sid, status: verification.status });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
