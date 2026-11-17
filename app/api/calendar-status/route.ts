import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { YEAR } from '@/lib/calendar';
import { r2 } from '@/lib/r2';

/** Has this distributor already got a calendar stored? (one file per ARN/mobile) */
export async function GET() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  const c = r2();
  if (!c) return NextResponse.json({ stored: false });
  try {
    const res = await c.aws.fetch(`${c.base}/calendars/${YEAR}/${id}.jpg`, { method: 'HEAD' });
    return NextResponse.json({ stored: res.ok });
  } catch {
    return NextResponse.json({ stored: false });
  }
}
