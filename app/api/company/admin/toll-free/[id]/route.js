import { NextResponse } from 'next/server';
import { getCurrentCompany } from '@/lib/auth';
import { getTollFreeVerification, deleteTollFreeVerification } from '@/lib/telnyxAdmin';

async function requireAdmin() {
  const company = await getCurrentCompany();
  if (!company) return { error: NextResponse.json({ error: 'Not logged in.' }, { status: 401 }) };
  if (!company.is_platform_admin) {
    return { error: NextResponse.json({ error: 'Not authorized.' }, { status: 403 }) };
  }
  return { company };
}

export async function GET(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    const v = await getTollFreeVerification(id);
    return NextResponse.json({ verification: v });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

// Note: unlike Twilio, Telnyx doesn't expose an "edit in place" endpoint for
// a submitted verification request. To change details, delete the existing
// request (if it's editable/rejected) and submit a new one via POST
// /api/company/admin/toll-free instead. See lib/telnyxAdmin.js for details.
export async function DELETE(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { id } = await params;
    await deleteTollFreeVerification(id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
