import { cookies } from 'next/headers';

export const ADMIN_COOKIE = 'helios_admin';

const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), (x) => x.toString(16).padStart(2, '0')).join('');

/** Session token derived from ADMIN_PASSWORD (changes when the password changes). */
export async function adminToken(): Promise<string | null> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return null;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey('raw', enc.encode(pw), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  return hex(await crypto.subtle.sign('HMAC', key, enc.encode('helios-admin-v1')));
}

export async function isAdmin(): Promise<boolean> {
  const expected = await adminToken();
  const got = (await cookies()).get(ADMIN_COOKIE)?.value;
  return !!expected && !!got && got === expected;
}
