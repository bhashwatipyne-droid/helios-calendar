import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminToken } from '@/lib/admin';

export async function POST(req: Request) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return NextResponse.json({ error: 'Admin not configured.' }, { status: 503 });
  const { password } = (await req.json().catch(() => ({}))) as { password?: string };
  await new Promise((r) => setTimeout(r, 400)); // slow down guessing
  if (!password || password !== expected) return NextResponse.json({ error: 'Wrong password.' }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, (await adminToken())!, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(ADMIN_COOKIE);
  return res;
}
