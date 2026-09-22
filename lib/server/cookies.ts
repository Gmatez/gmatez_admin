import { NextResponse } from 'next/server';
import { cookieSecure } from './env';

export const ACCESS_COOKIE = 'gmatez_at';
export const REFRESH_COOKIE = 'gmatez_rt';

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60;

export function setSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
) {
  const base = {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax' as const,
    path: '/',
  };
  response.cookies.set(ACCESS_COOKIE, accessToken, {
    ...base,
    maxAge: ACCESS_MAX_AGE,
  });
  response.cookies.set(REFRESH_COOKIE, refreshToken, {
    ...base,
    maxAge: REFRESH_MAX_AGE,
  });
}

export function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  response.cookies.set(REFRESH_COOKIE, '', {
    httpOnly: true,
    secure: cookieSecure(),
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
