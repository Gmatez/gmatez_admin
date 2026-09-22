import { NextResponse } from 'next/server';
import {
  applyRefreshedCookies,
  authorizedBackendFetch,
  expiredResponse,
} from '@/lib/server/backend';

const HOP_BY_HOP = new Set([
  'connection',
  'content-length',
  'host',
  'cookie',
  'authorization',
  'transfer-encoding',
]);

type RouteContext = { params: Promise<{ path: string[] }> };

async function proxy(request: Request, context: RouteContext) {
  const { path } = await context.params;
  const incoming = new URL(request.url);
  if (path.some((segment) => segment === '..' || segment.includes('\\'))) {
    return NextResponse.json(
      { error: { code: 'VALIDATION_FAILED', message: 'Invalid API path.' } },
      { status: 400 },
    );
  }
  const target = `/${path.join('/')}${incoming.search}`;
  const headers = new Headers();
  request.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  const method = request.method.toUpperCase();
  const body =
    method === 'GET' || method === 'HEAD' ? undefined : await request.text();
  let upstream: Awaited<ReturnType<typeof authorizedBackendFetch>>;
  try {
    upstream = await authorizedBackendFetch(target, {
      method,
      headers,
      body: body || undefined,
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
  if (upstream.response.status === 401) {
    return expiredResponse();
  }
  const responseBody = await upstream.response.arrayBuffer();
  const next = new NextResponse(responseBody, {
    status: upstream.response.status,
  });
  const contentType = upstream.response.headers.get('content-type');
  if (contentType) {
    next.headers.set('content-type', contentType);
  }
  const requestId = upstream.response.headers.get('x-request-id');
  if (requestId) {
    next.headers.set('x-request-id', requestId);
  }
  applyRefreshedCookies(next, upstream.refreshed);
  return next;
}

export const GET = proxy;
export const POST = proxy;
export const PATCH = proxy;
export const PUT = proxy;
export const DELETE = proxy;
