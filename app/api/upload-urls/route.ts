import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';
import { YEAR } from '@/lib/calendar';
import { presign, r2 } from '@/lib/r2';

/**
 * Returns a 5-minute presigned PUT URL so the browser can upload the finished calendar JPEG
 * straight to Cloudflare R2. One fixed key per distributor + year => re-downloads overwrite, never add files.
 */
export async function POST() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!r2()) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  return NextResponse.json({ jpg: await presign('PUT', `calendars/${YEAR}/${id}.jpg`) });
}
