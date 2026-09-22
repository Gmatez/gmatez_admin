import { cookies } from 'next/headers';
import { apiBaseUrl } from './env';
import {
  ACCESS_COOKIE,
  REFRESH_COOKIE,
  clearSessionCookies,
  setSessionCookies,
} from './cookies';
import { NextResponse } from 'next/server';

type TokenResponse = {
  accessToken: string;
  refreshToken: string;
  tokenType?: string;
  expiresIn?: string;
};

export async function backendFetch(
  path: string,
  init: RequestInit & { accessToken?: string } = {},
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (init.accessToken) {
    headers.set('authorization', `Bearer ${init.accessToken}`);
  }
  if (init.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  headers.set('accept', 'application/json');
  return fetch(`${apiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
}

export async function refreshSession(refreshToken: string): Promise<TokenResponse | null> {
  const response = await backendFetch('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    return null;
  }
  const body = (await response.json()) as TokenResponse;
  if (!body.accessToken || !body.refreshToken) {
    return null;
  }
  return body;
}

export async function authorizedBackendFetch(
  path: string,
  init: RequestInit = {},
): Promise<{ response: Response; refreshed: TokenResponse | null }> {
  const jar = await cookies();
  let access = jar.get(ACCESS_COOKIE)?.value;
  let refreshed: TokenResponse | null = null;
  const refreshToken = jar.get(REFRESH_COOKIE)?.value;
  if (!access && refreshToken) {
    refreshed = await refreshSession(refreshToken);
    access = refreshed?.accessToken;
  }
  let response = await backendFetch(path, { ...init, accessToken: access });
  if (response.status === 401 && refreshToken && !refreshed) {
    refreshed = await refreshSession(refreshToken);
    if (refreshed) {
      response = await backendFetch(path, {
        ...init,
        accessToken: refreshed.accessToken,
      });
    }
  }
  return { response, refreshed };
}

export function applyRefreshedCookies(
  response: NextResponse,
  refreshed: TokenResponse | null,
) {
  if (refreshed) {
    setSessionCookies(response, refreshed.accessToken, refreshed.refreshToken);
  }
}

export function expiredResponse(): NextResponse {
  const response = NextResponse.json(
    {
      error: {
        code: 'UNAUTHENTICATED',
        message: 'Your session has ended. Sign in again.',
      },
    },
    { status: 401 },
  );
  clearSessionCookies(response);
  return response;
}
