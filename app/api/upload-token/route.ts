import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

const enc = new TextEncoder();
const b64url = (b: ArrayBuffer | Uint8Array) =>
  Buffer.from(b instanceof Uint8Array ? b : new Uint8Array(b)).toString('base64url');

/** Issues a 5-minute token that lets the logged-in user upload THEIR finished calendar to the Cloudflare Worker. */
export async function POST() {
  const id = (await cookies()).get(SESSION_COOKIE)?.value;
  const secret = process.env.UPLOAD_SECRET;
  if (!id) return NextResponse.json({ error: 'Not logged in.' }, { status: 401 });
  if (!secret) return NextResponse.json({ error: 'Storage not configured.' }, { status: 503 });

  const body = b64url(enc.encode(JSON.stringify({ id, exp: Math.floor(Date.now() / 1000) + 300 })));
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = b64url(await crypto.subtle.sign('HMAC', key, enc.encode(body)));
  return NextResponse.json({ token: `${body}.${sig}` });
}
