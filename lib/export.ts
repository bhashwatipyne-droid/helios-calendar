import { PDFDocument } from 'pdf-lib';
import { PAGE_W, PAGE_H } from './calendar';

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) =>
  new Promise<Blob | null>((res) => c.toBlob(res, type, q));

/** Full-resolution (2195 x 2795 px, 300 dpi) PNG. */
export async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  const b = await toBlob(canvas, 'image/png');
  if (!b) throw new Error('png');
  return b;
}

/**
 * Print PDF: one page at trim + bleed size (7 x 9 in + 0.1575 in bleed) with TrimBox/BleedBox set, full-resolution image inside.
 * The image is embedded as near-lossless JPEG (q0.95) — fast and light enough for phones; the PNG stays lossless.
 */
export async function canvasToPdf(canvas: HTMLCanvasElement): Promise<Blob> {
  const flat = document.createElement('canvas');
  flat.width = canvas.width;
  flat.height = canvas.height;
  const x = flat.getContext('2d');
  if (!x) throw new Error('canvas');
  x.fillStyle = '#fff';
  x.fillRect(0, 0, flat.width, flat.height);
  x.drawImage(canvas, 0, 0);
  const jpg = await toBlob(flat, 'image/jpeg', 0.95);
  if (!jpg) throw new Error('jpeg');

  const pdf = await PDFDocument.create();
  const img = await pdf.embedJpg(new Uint8Array(await jpg.arrayBuffer()));
  const page = pdf.addPage([PAGE_W, PAGE_H]);
  page.drawImage(img, { x: 0, y: 0, width: PAGE_W, height: PAGE_H });
  // Print boxes: the page is trim (7 x 9 in) + 0.1575 in bleed on every side, so printers get proper TrimBox/BleedBox.
  const BLEED = 11.34; // pt
  page.setBleedBox(0, 0, PAGE_W, PAGE_H);
  page.setTrimBox(BLEED, BLEED, PAGE_W - 2 * BLEED, PAGE_H - 2 * BLEED);
  pdf.setTitle('Helios Mutual Fund — Personalised Calendar');
  const bytes = await pdf.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/**
 * Stores the finished calendar (print PNG + PDF) in Cloudflare R2 — never the user's original photo.
 * Fixed key per distributor => repeat downloads overwrite. Silent on failure: the user already has their file.
 */
export async function storeFinalCalendar(png: Blob, pdf: Blob): Promise<void> {
  try {
    const r = await fetch('/api/upload-urls', { method: 'POST' });
    if (!r.ok) return;
    const urls = (await r.json()) as { png: string; pdf: string };
    await Promise.all([
      fetch(urls.png, { method: 'PUT', headers: { 'Content-Type': 'image/png' }, body: png }),
      fetch(urls.pdf, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: pdf }),
    ]);
  } catch {
    /* ignore */
  }
}
