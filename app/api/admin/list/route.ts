import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { YEAR } from '@/lib/calendar';
import { listAll, r2 } from '@/lib/r2';

export type AdminRow = { id: string; updated: string; pdfSize: number; pngSize: number; pdf: boolean; png: boolean };

export async function GET() {
  if (!(await isAdmin())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!r2()) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  const rows = new Map<string, AdminRow>();
  for (const o of await listAll(`calendars/${YEAR}/`)) {
    const m = o.key.match(/^calendars\/\d+\/(.+)\.(png|pdf)$/);
    if (!m) continue;
    const [, id, ext] = m;
    const r = rows.get(id) ?? { id, updated: '', pdfSize: 0, pngSize: 0, pdf: false, png: false };
    if (ext === 'pdf') Object.assign(r, { pdf: true, pdfSize: o.size });
    else Object.assign(r, { png: true, pngSize: o.size });
    if (o.lastModified > r.updated) r.updated = o.lastModified;
    rows.set(id, r);
  }
  const list = [...rows.values()].sort((a, b) => (a.updated < b.updated ? 1 : -1));
  return NextResponse.json({ year: YEAR, rows: list });
}
