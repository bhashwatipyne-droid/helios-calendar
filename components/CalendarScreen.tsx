'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import CalendarArt from './CalendarArt';
import { SuccessModal, SampleModal } from './Modals';
import PhotoCropper, { CROP_RATIO } from './PhotoCropper';
import { YEAR, drawCalendar, loadImage, preloadCalendarAssets } from '@/lib/calendar';
import { canvasToJpeg, saveBlob, storeFinalCalendar } from '@/lib/export';

type Format = 'jpg';
const FORMATS: { id: Format; title: string; sub: string }[] = [
  { id: 'jpg', title: 'JPEG image', sub: 'High-resolution, 2195 × 2796 px — print quality' },
];

const MAX_BYTES = 15 * 1024 * 1024;
const PROCESSING_MS = 500;
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
  const [format, setFormat] = useState<Format>('jpg');
  const [menuOpen, setMenuOpen] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const splitRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void preloadCalendarAssets(); // warm the fonts/artwork while the user picks a photo
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  // Close the file-type menu on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (splitRef.current && !splitRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function pickAnotherPhoto() {
    setSuccess(false);
    fileInput.current?.click();
  }

  function handleFile(f: File | undefined) {
    if (!f || processing) return; // a new photo replaces the current one
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

  async function download() {
    if (!imgRef.current || busy) return;
    setMenuOpen(false);
    setBusy(true);
    setError('');
    try {
      const canvas = await drawCalendar(imgRef.current);
      const jpeg = await canvasToJpeg(canvas);
      saveBlob(jpeg, `helios-calendar-${YEAR}.jpg`);
      setSuccess(true);
      void storeFinalCalendar(jpeg); // best-effort; never blocks the download
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

        <input
          ref={fileInput}
          className="sr-only"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            handleFile(f);
          }}
        />

        <div className="cp-actions">
          {photo && (
            <button className="btn ghost" type="button" onClick={pickAnotherPhoto} disabled={busy || processing}>
              Change photo
            </button>
          )}
          <div className="split" ref={splitRef}>
            <button className="btn" type="button" style={FORMATS.length === 1 ? { borderRadius: 10 } : undefined} disabled={!photo || busy || processing} onClick={download}>
              {busy ? 'Preparing…' : 'Download JPEG'}
            </button>
            {FORMATS.length > 1 && (
            <button
              className="caret"
              type="button"
              aria-label="Choose file type"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              disabled={!photo || busy || processing}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            )}
            {FORMATS.length > 1 && menuOpen && (
              <div className="menu" role="menu" aria-label="File type">
                {FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    role="menuitemradio"
                    aria-checked={format === f.id}
                    onClick={() => {
                      setFormat(f.id);
                      setMenuOpen(false);
                    }}
                  >
                    <span className="tick" aria-hidden="true">
                      {format === f.id && (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 12l5 5 9-10" />
                        </svg>
                      )}
                    </span>
                    <span>
                      <span className="mt">{f.title}</span>
                      <span className="ms">{f.sub}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {success && <SuccessModal format="JPEG" onClose={() => setSuccess(false)} onTryAgain={pickAnotherPhoto} />}
      {sampleOpen && <SampleModal image={sampleImg} onClose={() => setSampleOpen(false)} />}
      {cropSource && <PhotoCropper image={cropSource} onCancel={() => setCropSource(null)} onApply={commitPhoto} />}
    </main>
  );
}
