'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarArt from './CalendarArt';
import { SuccessModal, SampleModal } from './Modals';
import { YEAR, drawCalendar, loadImage } from '@/lib/calendar';

const MAX_BYTES = 15 * 1024 * 1024;
const PROCESSING_MS = 1800;

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
      imgRef.current = img;
      setError('');
      setProcessing(true);
      // TODO: background removal / server-side processing goes here.
      timer.current = setTimeout(() => {
        setProcessing(false);
        setPhoto(src);
      }, PROCESSING_MS);
    };
    reader.readAsDataURL(f);
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
    </main>
  );
}
