export type AppEnvironment = 'development' | 'test' | 'staging' | 'production';

export function appEnvironment(): AppEnvironment {
  const value = process.env.APP_ENV ?? process.env.NODE_ENV ?? 'development';
  if (
    value === 'development' ||
    value === 'test' ||
    value === 'staging' ||
    value === 'production'
  ) {
    return value;
  }
  return 'development';
}

export function apiBaseUrl(): string {
  const env = appEnvironment();
  const configured = process.env.API_BASE_URL?.trim();
  if (env === 'production' || env === 'staging') {
    if (!configured) {
      throw new Error('API_BASE_URL is required outside development');
    }
    if (/localhost|127\.0\.0\.1/i.test(configured)) {
      throw new Error('Staging and production admin cannot target a localhost API');
    }
  }
  const base = configured || 'http://127.0.0.1:43121/api/v1';
  return base.replace(/\/$/, '');
}

export function apiOrigin(): string {
  return apiBaseUrl().replace(/\/api\/v1$/, '');
}

export function cookieSecure(): boolean {
  return appEnvironment() === 'production' || appEnvironment() === 'staging';
}
