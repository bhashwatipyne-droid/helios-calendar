import { NextResponse } from 'next/server';
import { SESSION_COOKIE, normaliseArn, normaliseEmployeeEmail, type LoginKind } from '@/lib/auth';

async function verifyRecaptcha(token: string | undefined, ip: string | null): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true; // reCAPTCHA not configured (local/dev) — skip
  if (!token) return false;
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set('remoteip', ip);
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return !!data.success;
  } catch {
    return false;
  }
}

export async function POST(req: Request) {
  let payload: { id?: string; captcha?: string; kind?: LoginKind } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  const employee = payload.kind === 'employee';
  const id = employee ? normaliseEmployeeEmail(payload.id ?? '') : normaliseArn(payload.id ?? '');
  if (!id) {
    return NextResponse.json(
      { error: employee ? 'Enter your Helios corporate email address.' : 'Enter a valid 6-digit ARN number.' },
      { status: 400 },
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? null;
  if (!(await verifyRecaptcha(payload.captcha, ip))) {
    return NextResponse.json({ error: 'Please complete the "I\'m not a robot" check.' }, { status: 400 });
  }

  // TODO: check `id` against Helios's distributor list before letting them in.

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
