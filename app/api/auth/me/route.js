import { NextResponse } from 'next/server';
import { getCurrentCompany } from '@/lib/auth';

export async function GET() {
  const company = await getCurrentCompany();
  if (!company) return NextResponse.json({ company: null }, { status: 401 });

  const { password_hash, ...safe } = company;
  return NextResponse.json({ company: safe });
}
