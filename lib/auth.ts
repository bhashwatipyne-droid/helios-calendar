export const SESSION_COOKIE = 'helios_user';

/** Accepts an ARN (e.g. ARN-12345) or a 10-digit Indian mobile number. Returns the normalised id or null. */
export function normaliseLoginId(raw: string): string | null {
  const v = raw.trim().replace(/\s+/g, '');
  if (/^ARN-?\d{3,7}$/i.test(v)) return v.toUpperCase().replace(/^ARN-?/, 'ARN-');
  if (/^(\+91)?[6-9]\d{9}$/.test(v)) return v.slice(-10);
  return null;
}

export function displayLabel(id: string): string {
  return /^\d{10}$/.test(id) ? `+91 ••••••${id.slice(-4)}` : id;
}
