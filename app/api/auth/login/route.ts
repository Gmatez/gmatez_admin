import { NextResponse } from 'next/server';
import { z } from 'zod';
import { backendFetch } from '@/lib/server/backend';
import { clearSessionCookies, setSessionCookies } from '@/lib/server/cookies';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(10).max(200),
});

export async function POST(request: Request) {
  const parsed = loginSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Enter a valid email and password.',
        },
      },
      { status: 422 },
    );
  }

  let upstream: Response;
  try {
    upstream = await backendFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(parsed.data),
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: 'INTERNAL',
          message: 'The Gmatez API is unreachable.',
        },
      },
      { status: 503 },
    );
  }

  const payload = (await upstream.json().catch(() => null)) as {
    accessToken?: string;
    refreshToken?: string;
    error?: { code?: string; message?: string; requestId?: string };
  } | null;

  if (!upstream.ok || !payload?.accessToken || !payload.refreshToken) {
    return NextResponse.json(
      payload ?? {
        error: { code: 'INVALID_CREDENTIALS', message: 'Sign-in failed.' },
      },
      { status: upstream.status || 401 },
    );
  }

  const me = await backendFetch('/users/me', {
    accessToken: payload.accessToken,
  });
  const user = (await me.json().catch(() => null)) as {
    id?: string;
    email?: string;
    role?: string;
    status?: string;
    profile?: { displayName?: string };
    error?: { code?: string; message?: string };
  } | null;

  if (!me.ok || !user?.id) {
    return NextResponse.json(
      user ?? {
        error: { code: 'UNAUTHENTICATED', message: 'Could not load the account.' },
      },
      { status: me.status || 401 },
    );
  }

  if (user.role !== 'ADMIN' || user.status !== 'ACTIVE') {
    const response = NextResponse.json(
      {
        error: {
          code: user.status === 'SUSPENDED' ? 'ACCOUNT_SUSPENDED' : 'FORBIDDEN',
          message:
            user.status === 'SUSPENDED'
              ? 'This admin account is suspended.'
              : user.status === 'DELETED'
                ? 'This admin account has been deleted.'
                : 'This account is not an active admin.',
        },
      },
      { status: 403 },
    );
    clearSessionCookies(response);
    return response;
  }

  const response = NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName ?? 'Admin',
    },
  });
  setSessionCookies(response, payload.accessToken, payload.refreshToken);
  return response;
}
