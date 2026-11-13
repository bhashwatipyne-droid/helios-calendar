import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth';

export function middleware(req: NextRequest) {
  const loggedIn = !!req.cookies.get(SESSION_COOKIE)?.value;
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/calendar') && !loggedIn) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (pathname === '/' && loggedIn) {
    return NextResponse.redirect(new URL('/calendar', req.url));
  }
  return NextResponse.next();
}

export const config = { matcher: ['/', '/calendar/:path*'] };
