import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { YEAR } from '@/lib/calendar';
import { presign, r2 } from '@/lib/r2';

/**
 * Returns 5-minute presigned PUT URLs so the browser can upload the finished calendar (PNG + PDF)
 * straight to Cloudflare R2. One fixed key per distributor + year => re-downloads overwrite, never add files.
 */
export async function POST() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!r2()) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  const key = (ext: 'png' | 'pdf') => `calendars/${YEAR}/${id}.${ext}`;
  return NextResponse.json({ png: await presign('PUT', key('png')), pdf: await presign('PUT', key('pdf')) });
}
