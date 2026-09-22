import { ApiError, parseBackendError } from '@/lib/errors';
import { notifyUnauthorized } from '@/lib/auth/unauthorized';

export type PageResult<T> = {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
};

type QueryValue = string | number | boolean | null | undefined;

export function toQuery(params: Record<string, QueryValue>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue;
    }
    search.set(key, String(value));
  }
  const text = search.toString();
  return text ? `?${text}` : '';
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json');
  }
  let response: Response;
  try {
    response = await fetch(`/api/proxy${path.startsWith('/') ? path : `/${path}`}`, {
      ...init,
      headers,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch (error) {
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const error = parseBackendError(response.status, body);
    if (error.status === 401) {
      notifyUnauthorized();
    }
    throw error;
  }
  return body as T;
}

export function apiGet<T>(path: string, params?: Record<string, QueryValue>) {
  return api<T>(`${path}${toQuery(params ?? {})}`);
}

export function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body?: unknown,
) {
  return api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}
