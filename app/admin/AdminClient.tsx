'use client';

import { useCallback, useEffect, useState } from 'react';
import { zipSync } from 'fflate';
import { saveBlob } from '@/lib/export';
import type { AdminRow } from '../api/admin/list/route';

const BATCH = 50;
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

export default function AdminClient() {
  const [state, setState] = useState<'loading' | 'error' | 'ready'>('loading');
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [year, setYear] = useState(0);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/list');
    if (!r.ok) {
      setMsg((await r.json().catch(() => ({}))).error ?? 'Could not load the list.');
      return setState('error');
    }
    const d = (await r.json()) as { year: number; rows: AdminRow[] };
    setRows(d.rows);
    setYear(d.year);
    setState('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function sign(ids: string[]) {
    const r = await fetch('/api/admin/sign', { method: 'POST', body: JSON.stringify({ ids }) });
    if (!r.ok) throw new Error('sign');
    return ((await r.json()) as { urls: { id: string; url: string }[] }).urls;
  }

  async function single(id: string) {
    const [u] = await sign([id]);
    window.open(u.url, '_blank');
  }

  async function zipBatch(ids: string[], label: string) {
    setBusy(label);
    setMsg('');
    try {
      const files: Record<string, Uint8Array> = {};
      for (const { id, url } of await sign(ids)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(id);
        files[`${id}.jpg`] = new Uint8Array(await res.arrayBuffer());
      }
      const zipped = zipSync(files, { level: 0 }); // JPEGs are already compressed
      saveBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), `helios-jpegs-${year}-${label}.zip`);
    } catch (e) {
      setMsg(`Download failed${e instanceof Error && e.message !== 'sign' ? ` at ${e.message}` : ''}. Check the bucket's CORS allows GET, then retry.`);
    } finally {
      setBusy('');
    }
  }

  const shown = rows.filter((r) => r.id.toLowerCase().includes(q.trim().toLowerCase()));
  const batches = Array.from({ length: Math.ceil(rows.length / BATCH) }, (_, i) => rows.slice(i * BATCH, (i + 1) * BATCH));
  const totalMb = rows.reduce((s, r) => s + r.size, 0);

  const wrap: React.CSSProperties = { maxWidth: 880, margin: '0 auto', padding: '24px 16px', fontFamily: 'Poppins, system-ui, sans-serif' };

  if (state === 'loading') return <main style={wrap}>Loading…</main>;

  if (state === 'error') return <main style={wrap}><h1>Admin</h1><p role="alert">{msg}</p></main>;

  return (
    <main style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Helios {year} calendars</h1>
      </div>
      <p>
        {rows.length} calendars · {mb(totalMb)} stored
      </p>

      <h2>Download for the printer</h2>
      {batches.length === 0 && <p>Nothing stored yet.</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {batches.map((b, i) => {
          const label = `part${i + 1}of${batches.length}`;
          return (
            <button key={label} className="btn" type="button" disabled={!!busy} onClick={() => zipBatch(b.map((r) => r.id), label)}>
              {busy === label ? 'Zipping…' : `JPEGs ${i * BATCH + 1}–${i * BATCH + b.length} (zip)`}
            </button>
          );
        })}
      </div>
      {msg && <p role="alert">{msg}</p>}

      <h2>All distributors</h2>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search ARN / mobile" style={{ padding: 10, width: '100%', maxWidth: 320, marginBottom: 8 }} />
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>ARN / mobile</th><th>Last saved</th><th>JPEG</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #ddd' }}>
                <td>{r.id}</td>
                <td>{r.updated ? new Date(r.updated).toLocaleString('en-IN') : '—'}</td>
                <td><button type="button" className="linkbtn" onClick={() => single(r.id)}>Open ({mb(r.size)})</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
