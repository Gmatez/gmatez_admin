import { describe, expect, it } from 'vitest';
import { parseBackendError } from '@/lib/errors';
import { safeNextPath } from '@/lib/auth/redirect';
import { allowedHostTransitions } from '@/lib/hosts/transitions';
import { can } from '@/lib/permissions';
import { formatBps, formatMoney, majorToMinor } from '@/lib/money';

describe('money', () => {
  it('formats minor units without dropping the decimal scale', () => {
    expect(formatMoney(10050, 'INR')).toBe('₹100.50');
    expect(formatMoney(10050, 'USD')).toBe('$100.50');
    expect(formatMoney(-250, 'USD')).toBe('-$2.50');
  });

  it('rejects non-integers', () => {
    expect(() => formatMoney(10.5)).toThrow(/integer minor units/);
  });

  it('parses major units into cents', () => {
    expect(majorToMinor('100.50')).toBe(10050);
    expect(majorToMinor('-5.5')).toBe(-550);
    expect(majorToMinor('10.555')).toBeNull();
  });

  it('formats basis points from the backend value', () => {
    expect(formatBps(8000)).toBe('80%');
    expect(formatBps(8050)).toBe('80.5%');
  });
});

describe('errors', () => {
  it('keeps the backend message and code', () => {
    const error = parseBackendError(409, {
      error: { code: 'HOST_INCOMPLETE', message: 'Host profile is incomplete.', requestId: 'req-1' },
    });
    expect(error.code).toBe('HOST_INCOMPLETE');
    expect(error.message).toBe('Host profile is incomplete.');
    expect(error.status).toBe(409);
  });
});

describe('auth redirects', () => {
  it('rejects external and protocol-relative targets', () => {
    expect(safeNextPath('https://evil.example')).toBe('/dashboard');
    expect(safeNextPath('//evil.example')).toBe('/dashboard');
    expect(safeNextPath('/hosts/abc')).toBe('/hosts/abc');
  });
});

describe('permissions', () => {
  it('allows the single ADMIN role and no others', () => {
    expect(can('ADMIN', 'hosts.review')).toBe(true);
  });
});

describe('host transitions', () => {
  it('matches the backend host state machine', () => {
    expect(allowedHostTransitions('PENDING_REVIEW')).toEqual(['ACTIVE', 'REJECTED']);
    expect(allowedHostTransitions('ACTIVE')).toEqual(['SUSPENDED']);
    expect(allowedHostTransitions('SUSPENDED')).toEqual(['ACTIVE']);
    expect(allowedHostTransitions('REJECTED')).toEqual(['PENDING_REVIEW']);
  });
});
