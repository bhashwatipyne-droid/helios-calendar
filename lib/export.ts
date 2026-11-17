/** Final print size: 2195 x 2796 px (trim + bleed at 300 dpi). */
export const JPEG_W = 2195;
export const JPEG_H = 2796;
export const JPEG_QUALITY = 0.95;

/** Full-resolution print JPEG (2195 x 2796 px). Any 1 px rounding difference is absorbed by a tiny scale. */
export async function canvasToJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  const out = document.createElement('canvas');
  out.width = JPEG_W;
  out.height = JPEG_H;
  const x = out.getContext('2d');
  if (!x) throw new Error('canvas');
  x.fillStyle = '#fff'; // JPEG has no transparency
  x.fillRect(0, 0, JPEG_W, JPEG_H);
  x.imageSmoothingQuality = 'high';
  x.drawImage(canvas, 0, 0, JPEG_W, JPEG_H);
  const blob = await new Promise<Blob | null>((res) => out.toBlob(res, 'image/jpeg', JPEG_QUALITY));
  if (!blob) throw new Error('jpeg');
  return blob;
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
 * Stores the finished calendar JPEG in Cloudflare R2 — never the user's original photo.
 * Fixed key per distributor => a repeat overwrites. Returns true only when the file is really saved.
 */
export async function storeFinalCalendar(jpeg: Blob): Promise<boolean> {
  try {
    const r = await fetch('/api/upload-urls', { method: 'POST' });
    if (!r.ok) return false;
    const { jpg } = (await r.json()) as { jpg: string };
    const put = await fetch(jpg, { method: 'PUT', headers: { 'Content-Type': 'image/jpeg' }, body: jpeg });
    return put.ok;
  } catch {
    return false;
  }
}
