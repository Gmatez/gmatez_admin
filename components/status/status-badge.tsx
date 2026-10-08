import { cn } from '@/lib/utils';

const TONE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  ONLINE: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  VERIFIED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  SUCCEEDED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  COMPLETED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  SETTLED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  SENT: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  RESOLVED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  CONFIGURED: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:ring-emerald-900',
  PENDING: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  PENDING_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  REQUESTED: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  PROCESSING: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  UNDER_REVIEW: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  REQUIRES_ACTION: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  CONNECTING: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-900',
  CONNECTED: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-900',
  RINGING: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-900',
  OPEN: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-950 dark:text-blue-100 dark:ring-blue-900',
  SUSPENDED: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  REJECTED: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  FAILED: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
  DELETED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  CANCELLED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  TIMEOUT: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-900',
  DISMISSED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  OFFLINE: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  PAUSED: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-900',
  BUSY: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-950 dark:text-orange-100 dark:ring-orange-900',
  NOT_APPLICABLE: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  CONFIG_REQUIRED: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:ring-amber-900',
  DISABLED: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
  error: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-950 dark:text-red-200 dark:ring-red-900',
};

export function StatusBadge({ value }: { value: string | null | undefined }) {
  const label = value ?? 'UNKNOWN';
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        TONE[label] ?? 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700',
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
      <span className="sr-only">Status: </span>
      {label.replaceAll('_', ' ')}
    </span>
  );
}
