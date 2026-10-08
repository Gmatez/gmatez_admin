import { format, formatDistanceToNow } from 'date-fns';

export function formatWhen(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return format(date, 'dd MMM yyyy HH:mm');
}

export function formatActivity(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  const age = Date.now() - date.getTime();
  if (age >= 0 && age < 1000 * 60 * 60 * 24 * 7) {
    return formatDistanceToNow(date, { addSuffix: true });
  }
  return format(date, 'dd MMM yyyy');
}
