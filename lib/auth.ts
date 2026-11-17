export const SESSION_COOKIE = 'helios_user';

export type LoginKind = 'mfd' | 'employee';

/** ARNs are exactly six digits. Stored/displayed as ARN-123456. */
export function normaliseArn(raw: string): string | null {
  const digits = raw.replace(/^\s*ARN[-\s]?/i, '').trim();
  return /^\d{6}$/.test(digits) ? `ARN-${digits}` : null;
}

/** Corporate domains allowed on the employee URL (comma-separated env var). */
export function employeeDomains(): string[] {
  return (process.env.EMPLOYEE_EMAIL_DOMAINS || 'heliosmf.in')
    .split(',')
    .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
    .filter(Boolean);
}

/** Only corporate employee emails. Stored as EMP-<name>_at_<domain> (safe for storage keys). */
export function normaliseEmployeeEmail(raw: string): string | null {
  const v = raw.trim().toLowerCase();
  const m = v.match(/^([a-z0-9][a-z0-9._+-]{0,63})@([a-z0-9.-]+\.[a-z]{2,})$/);
  if (!m || !employeeDomains().includes(m[2])) return null;
  return `EMP-${m[1]}_at_${m[2]}`;
}

/** Ids that may exist in storage (includes older mobile/short-ARN test files). */
export const STORED_ID_RE = /^(ARN-\d{3,7}|EMP-[a-z0-9._+-]+_at_[a-z0-9.-]+|[6-9]\d{9})$/;

export const isEmployeeId = (id: string) => id.startsWith('EMP-');

export function displayLabel(id: string): string {
  if (isEmployeeId(id)) return id.slice(4).replace('_at_', '@');
  return /^\d{10}$/.test(id) ? `+91 ••••••${id.slice(-4)}` : id;
}
