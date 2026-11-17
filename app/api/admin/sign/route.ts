import { NextResponse } from 'next/server';
import { YEAR } from '@/lib/calendar';
import { presign } from '@/lib/r2';

/** Presigned GET URLs (1 hour) for the given distributor ids. Body: { ids: string[] } */
export async function POST(req: Request) {
  const { ids } = (await req.json().catch(() => ({}))) as { ids?: string[] };
  if (!Array.isArray(ids) || ids.length > 100) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const safe = ids.filter((i) => /^(ARN-\d{3,7}|[6-9]\d{9})$/.test(i));
  const urls = await Promise.all(safe.map(async (id) => ({ id, url: await presign('GET', `calendars/${YEAR}/${id}.jpg`, 3600) })));
  return NextResponse.json({ urls });
}
