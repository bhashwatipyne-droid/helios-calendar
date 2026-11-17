'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarArt from './CalendarArt';
import { SuccessModal, SampleModal } from './Modals';
import PhotoCropper, { CROP_RATIO } from './PhotoCropper';
import { YEAR, drawCalendar, loadImage } from '@/lib/calendar';

const MAX_BYTES = 15 * 1024 * 1024;
const PROCESSING_MS = 1800;
const ASPECT_TOLERANCE = 0.02; // photos within 2% of 5:4 skip the crop step

export default function CalendarScreen({ userLabel }: { userLabel: string }) {
  const router = useRouter();
  const imgRef = useRef<HTMLImageElement | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [sampleOpen, setSampleOpen] = useState(false);
  const [sampleImg, setSampleImg] = useState<string | null>(null);
  const [cropSource, setCropSource] = useState<HTMLImageElement | null>(null);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleFile(f: File | undefined) {
    if (!f || photo || processing) return;
    if (!/^image\/(jpeg|png|webp)$/.test(f.type)) return setError('Please choose a JPG, PNG or WebP photo.');
    if (f.size > MAX_BYTES) return setError('That photo is over 15 MB. Please choose a smaller one.');
    const reader = new FileReader();
    reader.onload = async () => {
      const src = reader.result as string;
      const img = await loadImage(src);
      if (!img) return setError('We could not read that photo. Please try another one.');
      setError('');
      const ratio = img.naturalWidth / img.naturalHeight;
      if (Math.abs(ratio - CROP_RATIO) / CROP_RATIO > ASPECT_TOLERANCE) {
        setCropSource(img); // not 5:4 -> let the user crop / resize first
      } else {
        commitPhoto(src, img);
      }
    };
    reader.readAsDataURL(f);
  }

  function commitPhoto(src: string, img: HTMLImageElement) {
    setCropSource(null);
    imgRef.current = img;
    setProcessing(true);
    // TODO: background removal / server-side processing goes here.
    timer.current = setTimeout(() => {
      setProcessing(false);
      setPhoto(src);
    }, PROCESSING_MS);
  }

  /**
   * Compressed copy for storage (the user's own download stays the full-quality PNG).
   * Always <= STORAGE_MAX_BYTES: tries lower JPEG quality, then a smaller size.
   */
  async function compressForStorage(src: HTMLCanvasElement): Promise<Blob | null> {
    const STORAGE_MAX_BYTES = 900 * 1024;
    const encode = (c: HTMLCanvasElement, q: number) =>
      new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', q));
    const flatten = (scale: number) => {
      const c = document.createElement('canvas');
      c.width = Math.round(src.width * scale);
      c.height = Math.round(src.height * scale);
      const x = c.getContext('2d');
      if (!x) return null;
      x.fillStyle = '#fff'; // JPEG has no transparency
      x.fillRect(0, 0, c.width, c.height);
      x.drawImage(src, 0, 0, c.width, c.height);
      return c;
    };
    for (const [scale, qualities] of [[1, [0.75, 0.6, 0.5]], [0.7, [0.6, 0.45]]] as const) {
      const c = flatten(scale);
      if (!c) return null;
      for (const q of qualities) {
        const b = await encode(c, q);
        if (b && b.size <= STORAGE_MAX_BYTES) return b;
      }
    }
    return null;
  }

  /** Stores only a compressed copy of the finished calendar (never the original photo). One file per user — re-downloads replace it. */
  async function saveFinalCalendar(canvas: HTMLCanvasElement) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;
    try {
      const blob = await compressForStorage(canvas);
      if (!blob) return;
      const t = await fetch('/api/upload-token', { method: 'POST' });
      if (!t.ok) return;
      const { token } = (await t.json()) as { token: string };
      const r = await fetch(`${url}/functions/v1/helios-upload-url`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, year: YEAR }),
      });
      if (!r.ok) return;
      const { path, token: uploadToken } = (await r.json()) as { path: string; token: string };
      const { createClient } = await import('@supabase/supabase-js');
      await createClient(url, key).storage
        .from('helios-calendars')
        .uploadToSignedUrl(path, uploadToken, blob, { contentType: 'image/jpeg' });
    } catch {
      /* the user already has their download */
    }
  }

  async function download() {
    if (!imgRef.current || busy) return;
    setBusy(true);
    setError('');
    try {
      const canvas = await drawCalendar(imgRef.current);
      const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
      if (!blob) throw new Error('empty');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `helios-calendar-${YEAR}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      setSuccess(true);
      void saveFinalCalendar(canvas); // best-effort; never blocks the download
    } catch {
      setError('Something went wrong while creating your calendar. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function openSample() {
    setSampleOpen(true);
    if (!sampleImg) {
      const canvas = await drawCalendar(null, { sample: true });
      setSampleImg(canvas.toDataURL('image/jpeg', 0.85));
    }
  }

  async function logout() {
    await fetch('/api/login', { method: 'DELETE' }).catch(() => {});
    router.replace('/');
    router.refresh();
  }

  return (
    <main className="cp">
      <div className="cp-inner">
        <header className="cp-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Helios Mutual Fund" />
          <div className="cp-user">
            <span>{userLabel}</span>
            <button type="button" className="linkbtn" onClick={logout}>
              Log out
            </button>
          </div>
        </header>

        <div className="cp-title">
          <h1>Calendar</h1>
          <button className="linkbtn" type="button" onClick={openSample}>
            Preview sample
          </button>
        </div>

        <div className="cp-card">
          <CalendarArt photo={photo} processing={processing} onFile={handleFile} />
        </div>

        {error && (
          <p role="alert" className="cp-error">
            {error}
          </p>
        )}

        <div className="cp-dl">
          <button className="btn" type="button" disabled={!photo || busy} onClick={download}>
            {busy ? 'Preparing…' : 'Download'}
          </button>
        </div>
      </div>

      {success && <SuccessModal onClose={() => setSuccess(false)} />}
      {sampleOpen && <SampleModal image={sampleImg} onClose={() => setSampleOpen(false)} />}
      {cropSource && <PhotoCropper image={cropSource} onCancel={() => setCropSource(null)} onApply={commitPhoto} />}
    </main>
  );
}
