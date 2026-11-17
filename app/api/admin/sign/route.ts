import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { YEAR } from '@/lib/calendar';
import { presign } from '@/lib/r2';

/** Presigned GET URLs (1 hour) for the given distributor ids. Body: { ids: string[], ext: 'pdf' | 'png' } */
export async function POST(req: Request) {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { ids, ext } = (await req.json().catch(() => ({}))) as { ids?: string[]; ext?: string };
  if (!Array.isArray(ids) || ids.length > 100 || (ext !== 'pdf' && ext !== 'png')) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
  const safe = ids.filter((i) => /^(ARN-\d{3,7}|[6-9]\d{9})$/.test(i));
  const urls = await Promise.all(safe.map(async (id) => ({ id, url: await presign('GET', `calendars/${YEAR}/${id}.${ext}`, 3600) })));
  return NextResponse.json({ urls });
}
