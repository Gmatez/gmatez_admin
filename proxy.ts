import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { safeNextPath } from '@/lib/auth/redirect';

const PROTECTED = [
  '/dashboard',
  '/users',
  '/hosts',
  '/calls',
  '/payments',
  '/wallet',
  '/earnings',
  '/payouts',
  '/notifications',
  '/reports',
  '/audit-logs',
  '/banners',
  '/settings',
  '/health',
];

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession =
    request.cookies.has('gmatez_at') || request.cookies.has('gmatez_rt');
  const isProtected = PROTECTED.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(
      new URL(safeNextPath(request.nextUrl.searchParams.get('next')), request.url),
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
