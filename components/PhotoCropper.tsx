'use client';

import { useEffect, useMemo, useRef, useState, type PointerEvent as RPointerEvent } from 'react';
import { loadImage } from '@/lib/calendar';

export const CROP_RATIO = 5 / 4; // matches the calendar photo slot (238.24 x 190.83 pt)
const OUT_W = 1240; // output size (~375 dpi in the slot, comfortably above 300)
const OUT_H = Math.round(OUT_W / CROP_RATIO);
const MAX_ZOOM = 4;
const MIN_GOOD_WIDTH = 800; // below this the photo may look soft

type Props = {
  image: HTMLImageElement;
  onCancel: () => void;
  onApply: (dataUrl: string, img: HTMLImageElement) => void;
};

/**
 * 5:4 crop / resize step.
 * zoom = 1  -> the photo fills the 5:4 frame (largest 5:4 area of the photo)
 * zoom < 1  -> zoomed out so more of the photo fits; empty space is filled with a blurred copy
 */
export default function PhotoCropper({ image, onCancel, onApply }: Props) {
  const iw = image.naturalWidth;
  const ih = image.naturalHeight;
  const coverW = Math.min(iw, ih * CROP_RATIO); // crop width (image px) at zoom 1
  const minZoom = coverW / Math.max(iw, ih * CROP_RATIO); // whole photo visible

  const [zoom, setZoom] = useState(1);
  const [center, setCenter] = useState({ x: iw / 2, y: ih / 2 });
  const [busy, setBusy] = useState(false);
  const view = useRef<HTMLDivElement>(null);
  const drag = useRef<{ px: number; py: number; cx: number; cy: number; scale: number } | null>(null);

  const cropW = coverW / zoom;
  const cropH = cropW / CROP_RATIO;

  const clamp = (c: { x: number; y: number }, w = cropW, h = cropH) => ({
    x: w >= iw ? iw / 2 : Math.min(Math.max(c.x, w / 2), iw - w / 2),
    y: h >= ih ? ih / 2 : Math.min(Math.max(c.y, h / 2), ih - h / 2),
  });

  // Re-clamp whenever zoom changes
  useEffect(() => {
    setCenter((c) => clamp(c));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onCancel]);

  const imgStyle = useMemo(
    () => ({
      width: `${(iw / cropW) * 100}%`,
      left: `${(-(center.x - cropW / 2) / cropW) * 100}%`,
      top: `${(-(center.y - cropH / 2) / cropH) * 100}%`,
    }),
    [iw, cropW, cropH, center],
  );

  const effectiveWidth = Math.min(cropW, iw);
  const lowRes = effectiveWidth < MIN_GOOD_WIDTH;

  function onPointerDown(e: RPointerEvent<HTMLDivElement>) {
    const rect = view.current?.getBoundingClientRect();
    if (!rect) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { px: e.clientX, py: e.clientY, cx: center.x, cy: center.y, scale: cropW / rect.width };
  }
  function onPointerMove(e: RPointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (!d) return;
    setCenter(clamp({ x: d.cx - (e.clientX - d.px) * d.scale, y: d.cy - (e.clientY - d.py) * d.scale }));
  }
  function onPointerUp() {
    drag.current = null;
  }
  function nudge(dx: number, dy: number) {
    setCenter((c) => clamp({ x: c.x + dx * cropW * 0.05, y: c.y + dy * cropH * 0.05 }));
  }

  async function apply() {
    setBusy(true);
    const c = document.createElement('canvas');
    c.width = OUT_W;
    c.height = OUT_H;
    const x = c.getContext('2d');
    if (!x) return;
    x.fillStyle = '#F1F1F1';
    x.fillRect(0, 0, OUT_W, OUT_H);

    // Blurred fill for any empty space when zoomed out
    if (cropW > iw || cropH > ih) {
      const s = Math.max(OUT_W / iw, OUT_H / ih);
      x.save();
      x.filter = 'blur(24px) brightness(1.05)';
      x.drawImage(image, (OUT_W - iw * s) / 2 - 30, (OUT_H - ih * s) / 2 - 30, iw * s + 60, ih * s + 60);
      x.restore();
    }

    const k = OUT_W / cropW;
    x.imageSmoothingQuality = 'high';
    x.drawImage(image, -(center.x - cropW / 2) * k, -(center.y - cropH / 2) * k, iw * k, ih * k);

    const url = c.toDataURL('image/jpeg', 0.92);
    const img = await loadImage(url);
    setBusy(false);
    if (img) onApply(url, img);
  }

  const zoomPct = Math.round(zoom * 100);

  return (
    <div className="overlay">
      <div className="dialog crop" role="dialog" aria-modal="true" aria-labelledby="crop-title">
        <h2 id="crop-title">Adjust your photo</h2>
        <p className="crop-hint">Your photo doesn&apos;t match the 5:4 frame. Drag to reposition and use the slider to zoom.</p>

        <div
          ref={view}
          className="crop-view"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onKeyDown={(e) => {
            const map: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
            if (map[e.key]) {
              e.preventDefault();
              nudge(...map[e.key]);
            }
          }}
          tabIndex={0}
          aria-label="Photo crop area. Drag or use arrow keys to reposition."
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="crop-bg" src={image.src} alt="" draggable={false} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="crop-img" src={image.src} alt="" draggable={false} style={imgStyle} />
          <div className="crop-grid" aria-hidden="true" />
        </div>

        <div className="crop-zoom">
          <button type="button" className="crop-icon" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(minZoom, +(z - 0.1).toFixed(3)))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14" /></svg>
          </button>
          <label htmlFor="zoom" className="sr-only">Zoom</label>
          <input id="zoom" type="range" min={minZoom} max={MAX_ZOOM} step={0.01} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-valuetext={`${zoomPct}%`} />
          <button type="button" className="crop-icon" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.1).toFixed(3)))}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M5 12h14M12 5v14" /></svg>
          </button>
        </div>
        <div className="crop-presets">
          <button type="button" className="linkbtn" onClick={() => { setZoom(minZoom); setCenter({ x: iw / 2, y: ih / 2 }); }}>Fit whole photo</button>
          <button type="button" className="linkbtn" onClick={() => { setZoom(1); setCenter({ x: iw / 2, y: ih / 2 }); }}>Fill frame</button>
        </div>

        {lowRes && <p className="crop-warn">This photo is quite small, so it may look blurry on the calendar. A larger photo will look sharper.</p>}

        <div className="crop-actions">
          <button type="button" className="btn ghost" onClick={onCancel} disabled={busy}>Choose another</button>
          <button type="button" className="btn" onClick={apply} disabled={busy}>{busy ? 'Applying…' : 'Use this photo'}</button>
        </div>
      </div>
    </div>
  );
}
