import { NextResponse } from 'next/server';
import { getCurrentCompany } from '@/lib/auth';
import { getTollFreeVerification, editTollFreeVerification, deleteTollFreeVerification } from '@/lib/twilioAdmin';

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
    const { sid } = await params;
    const v = await getTollFreeVerification(sid);
    return NextResponse.json({ verification: v });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { sid } = await params;
    const { editReason, ...fields } = await request.json();

    // Twilio only allows edits while edit_allowed is true and before
    // edit_expiration — check first so the error message is useful rather
    // than a generic Twilio API failure.
    const current = await getTollFreeVerification(sid);
    if (current.editAllowed === false) {
      return NextResponse.json(
        {
          error:
            "This request can't be edited (edit_allowed is false) — it may be too old, or Twilio requires a fresh submission instead. Check rejectionReasons for details.",
        },
        { status: 400 }
      );
    }
    if (current.editExpiration && new Date(current.editExpiration) < new Date()) {
      return NextResponse.json(
        { error: 'The edit window for this request has expired. Submit a new TFV request instead.' },
        { status: 400 }
      );
    }

    const updated = await editTollFreeVerification(sid, fields, editReason);
    return NextResponse.json({ ok: true, sid: updated.sid, status: updated.status });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const { error } = await requireAdmin();
  if (error) return error;

  try {
    const { sid } = await params;
    await deleteTollFreeVerification(sid);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: String(err.message || err) }, { status: 500 });
  }
}
