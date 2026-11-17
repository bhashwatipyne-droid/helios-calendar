'use client';

import { useCallback, useEffect, useState } from 'react';
import { zipSync } from 'fflate';
import { saveBlob } from '@/lib/export';
import type { AdminRow } from '../api/admin/list/route';

const BATCH = 50;
const mb = (n: number) => `${(n / 1048576).toFixed(1)} MB`;

export default function AdminClient() {
  const [state, setState] = useState<'loading' | 'login' | 'ready'>('loading');
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [year, setYear] = useState(0);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState('');
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const r = await fetch('/api/admin/list');
    if (r.status === 401) return setState('login');
    if (!r.ok) {
      setMsg((await r.json().catch(() => ({}))).error ?? 'Could not load the list.');
      return setState('login');
    }
    const d = (await r.json()) as { year: number; rows: AdminRow[] };
    setRows(d.rows);
    setYear(d.year);
    setState('ready');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setMsg('');
    const r = await fetch('/api/admin/login', { method: 'POST', body: JSON.stringify({ password }) });
    if (!r.ok) return setMsg((await r.json().catch(() => ({}))).error ?? 'Login failed.');
    setPassword('');
    await load();
  }

  async function logout() {
    await fetch('/api/admin/login', { method: 'DELETE' });
    setRows([]);
    setState('login');
  }

  async function sign(ids: string[], ext: 'pdf' | 'png') {
    const r = await fetch('/api/admin/sign', { method: 'POST', body: JSON.stringify({ ids, ext }) });
    if (!r.ok) throw new Error('sign');
    return ((await r.json()) as { urls: { id: string; url: string }[] }).urls;
  }

  async function single(id: string, ext: 'pdf' | 'png') {
    const [u] = await sign([id], ext);
    window.open(u.url, '_blank');
  }

  async function zipBatch(ids: string[], ext: 'pdf' | 'png', label: string) {
    setBusy(label);
    setMsg('');
    try {
      const files: Record<string, Uint8Array> = {};
      for (const { id, url } of await sign(ids, ext)) {
        const res = await fetch(url);
        if (!res.ok) throw new Error(id);
        files[`${id}.${ext}`] = new Uint8Array(await res.arrayBuffer());
      }
      const zipped = zipSync(files, { level: 0 }); // PDFs/PNGs are already compressed
      saveBlob(new Blob([zipped as BlobPart], { type: 'application/zip' }), `helios-${ext}-${year}-${label}.zip`);
    } catch (e) {
      setMsg(`Download failed${e instanceof Error && e.message !== 'sign' ? ` at ${e.message}` : ''}. Check the bucket's CORS allows GET, then retry.`);
    } finally {
      setBusy('');
    }
  }

  const shown = rows.filter((r) => r.id.toLowerCase().includes(q.trim().toLowerCase()));
  const withPdf = rows.filter((r) => r.pdf);
  const batches = Array.from({ length: Math.ceil(withPdf.length / BATCH) }, (_, i) => withPdf.slice(i * BATCH, (i + 1) * BATCH));
  const totalMb = rows.reduce((s, r) => s + r.pdfSize + r.pngSize, 0);

  const wrap: React.CSSProperties = { maxWidth: 880, margin: '0 auto', padding: '24px 16px', fontFamily: 'Poppins, system-ui, sans-serif' };

  if (state === 'loading') return <main style={wrap}>Loading…</main>;

  if (state === 'login') {
    return (
      <main style={wrap}>
        <h1>Admin</h1>
        <form onSubmit={login} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Admin password" autoFocus style={{ padding: 10, flex: '1 1 220px' }} />
          <button className="btn" type="submit">Sign in</button>
        </form>
        {msg && <p role="alert">{msg}</p>}
      </main>
    );
  }

  return (
    <main style={wrap}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h1>Helios {year} calendars</h1>
        <button type="button" className="linkbtn" onClick={logout}>Sign out</button>
      </div>
      <p>
        {rows.length} distributors · {withPdf.length} PDFs · {mb(totalMb)} stored
      </p>

      <h2>Download for the printer</h2>
      {batches.length === 0 && <p>Nothing stored yet.</p>}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        {batches.map((b, i) => {
          const label = `part${i + 1}of${batches.length}`;
          return (
            <button key={label} className="btn" type="button" disabled={!!busy} onClick={() => zipBatch(b.map((r) => r.id), 'pdf', label)}>
              {busy === label ? 'Zipping…' : `PDFs ${i * BATCH + 1}–${i * BATCH + b.length} (zip)`}
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
              <th>ARN / mobile</th><th>Last saved</th><th>PDF</th><th>PNG</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} style={{ borderTop: '1px solid #ddd' }}>
                <td>{r.id}</td>
                <td>{r.updated ? new Date(r.updated).toLocaleString('en-IN') : '—'}</td>
                <td>{r.pdf ? <button type="button" className="linkbtn" onClick={() => single(r.id, 'pdf')}>Open ({mb(r.pdfSize)})</button> : '—'}</td>
                <td>{r.png ? <button type="button" className="linkbtn" onClick={() => single(r.id, 'png')}>Open ({mb(r.pngSize)})</button> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}
