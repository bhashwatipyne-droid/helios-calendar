import { NextResponse } from 'next/server';
import { YEAR } from '@/lib/calendar';
import { listAll, r2 } from '@/lib/r2';

export type AdminRow = { id: string; updated: string; size: number };

export async function GET() {
  if (!r2()) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  const rows: AdminRow[] = [];
  for (const o of await listAll(`calendars/${YEAR}/`)) {
    const m = o.key.match(/^calendars\/\d+\/(.+)\.jpg$/);
    if (m) rows.push({ id: m[1], updated: o.lastModified, size: o.size });
  }
  rows.sort((a, b) => (a.updated < b.updated ? 1 : -1));
  return NextResponse.json({ year: YEAR, rows });
}
