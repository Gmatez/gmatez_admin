import { cn } from '@/lib/utils';

const TONE: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  ONLINE: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  VERIFIED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  SUCCEEDED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  COMPLETED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  SETTLED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  SENT: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  RESOLVED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  CONFIGURED: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  ok: 'bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-200',
  PENDING: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  PENDING_REVIEW: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  REQUESTED: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  PROCESSING: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  UNDER_REVIEW: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  REQUIRES_ACTION: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  CONNECTING: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100',
  CONNECTED: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100',
  RINGING: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100',
  OPEN: 'bg-sky-100 text-sky-950 dark:bg-sky-950 dark:text-sky-100',
  SUSPENDED: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  REJECTED: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  FAILED: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
  DELETED: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  CANCELLED: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  TIMEOUT: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
  DISMISSED: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  OFFLINE: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  PAUSED: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
  BUSY: 'bg-orange-100 text-orange-950 dark:bg-orange-950 dark:text-orange-100',
  NOT_APPLICABLE: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  CONFIG_REQUIRED: 'bg-amber-100 text-amber-950 dark:bg-amber-950 dark:text-amber-100',
  DISABLED: 'bg-stone-200 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
  error: 'bg-red-100 text-red-900 dark:bg-red-950 dark:text-red-200',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? 'UNKNOWN';
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium tracking-wide',
        TONE[label] ?? 'bg-stone-100 text-stone-800 dark:bg-stone-800 dark:text-stone-100',
      )}
    >
      <span className="sr-only">Status: </span>
      {label.replaceAll('_', ' ')}
    </span>
  );
}
