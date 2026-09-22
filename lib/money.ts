const SAFE_MINOR_LIMIT = 9_000_000_000_000_000;

export function assertMinorUnits(amountMinor: number): void {
  if (!Number.isSafeInteger(amountMinor)) {
    throw new Error('Money amounts must be integer minor units');
  }
  if (Math.abs(amountMinor) > SAFE_MINOR_LIMIT) {
    throw new Error('Money amount is outside the supported range');
  }
}

/**
 * Formats integer minor units. 10050 USD is $100.50, never $10050.
 * The currency code comes from the backend. No FX conversion is applied.
 */
export function formatMoney(amountMinor: number, currency = 'USD'): string {
  assertMinorUnits(amountMinor);
  const negative = amountMinor < 0;
  const absolute = Math.abs(amountMinor);
  const major = Math.trunc(absolute / 100);
  const minor = absolute % 100;
  const fraction = minor.toString().padStart(2, '0');
  const code = currency.toUpperCase();
  const locale = code === 'INR' ? 'en-IN' : 'en-US';
  const grouped = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(major);
  const symbol = code === 'INR' ? '₹' : code === 'USD' ? '$' : `${code} `;
  return `${negative ? '-' : ''}${symbol}${grouped}.${fraction}`;
}

/** Parses a major-unit string such as "100.50" into integer minor units. */
export function majorToMinor(input: string): number | null {
  const trimmed = input.trim();
  if (!/^-?\d+(\.\d{1,2})?$/.test(trimmed)) {
    return null;
  }
  const negative = trimmed.startsWith('-');
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [majorPart, fractionPart = ''] = unsigned.split('.');
  const major = Number.parseInt(majorPart, 10);
  const fraction = Number.parseInt(fractionPart.padEnd(2, '0').slice(0, 2), 10);
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(fraction)) {
    return null;
  }
  const minor = major * 100 + fraction;
  if (!Number.isSafeInteger(minor) || minor > SAFE_MINOR_LIMIT) {
    return null;
  }
  return negative ? -minor : minor;
}

export function formatBps(bps: number): string {
  if (!Number.isInteger(bps) || bps < 0) {
    return '—';
  }
  const whole = Math.trunc(bps / 100);
  const fraction = bps % 100;
  if (fraction === 0) {
    return `${whole}%`;
  }
  const text = fraction.toString().padStart(2, '0').replace(/0$/, '');
  return `${whole}.${text}%`;
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  const total = Math.trunc(seconds);
  const minutes = Math.trunc(total / 60);
  const remain = total % 60;
  if (minutes === 0) {
    return `${remain}s`;
  }
  return `${minutes}m ${remain.toString().padStart(2, '0')}s`;
}
