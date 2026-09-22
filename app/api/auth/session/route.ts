import { NextResponse } from 'next/server';
import {
  applyRefreshedCookies,
  authorizedBackendFetch,
  expiredResponse,
} from '@/lib/server/backend';

export async function GET() {
  const { response, refreshed } = await authorizedBackendFetch('/users/me');
  if (response.status === 401) {
    return expiredResponse();
  }
  const user = (await response.json().catch(() => null)) as {
    id?: string;
    email?: string;
    role?: string;
    status?: string;
    profile?: { displayName?: string };
    error?: { code?: string; message?: string; requestId?: string };
  } | null;
  if (!response.ok || !user?.id) {
    const next = NextResponse.json(user ?? { error: { code: 'INTERNAL', message: 'Could not load session.' } }, {
      status: response.status,
    });
    applyRefreshedCookies(next, refreshed);
    return next;
  }
  if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
    const next = NextResponse.json(
      {
        error: {
          code: 'FORBIDDEN',
          message: 'This account cannot use the admin panel.',
        },
      },
      { status: 403 },
    );
    applyRefreshedCookies(next, null);
    next.cookies.set('gmatez_at', '', { path: '/', maxAge: 0 });
    next.cookies.set('gmatez_rt', '', { path: '/', maxAge: 0 });
    return next;
  }
  const next = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName ?? 'Admin',
    },
  });
  applyRefreshedCookies(next, refreshed);
  return next;
}
