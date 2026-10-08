import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { errorText } from '@/lib/errors';
import { ApiError } from '@/lib/errors';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 dark:bg-slate-800 ${className}`}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <SkeletonBlock className="h-8 w-56" />
      <SkeletonBlock className="h-4 w-72" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
        <SkeletonBlock className="h-28" />
      </div>
      <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-950">
        <SkeletonBlock className="h-8 w-full" />
        <SkeletonBlock className="h-8 w-full" />
        <SkeletonBlock className="h-8 w-5/6" />
        <SkeletonBlock className="h-8 w-full" />
        <SkeletonBlock className="h-8 w-2/3" />
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-200">
        <Inbox className="h-5 w-5" aria-hidden />
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">{body}</p>
      {action ? <div className="mt-4 flex justify-center">{action}</div> : null}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
}: {
  error: unknown;
  onRetry?: () => void;
}) {
  const denied = error instanceof ApiError && error.status === 403;
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-5 dark:border-red-900 dark:bg-red-950/40"
    >
      <h2 className="font-semibold text-red-900 dark:text-red-100">
        {denied ? 'Permission denied' : 'Something went wrong'}
      </h2>
      <p className="mt-1 text-sm text-red-800 dark:text-red-200">
        {denied ? errorText(error) : errorText(error) || 'We could not load this data right now.'}
      </p>
      {error instanceof ApiError && error.code ? (
        <p className="mt-1 font-mono text-xs text-red-700 dark:text-red-300">{error.code}</p>
      ) : null}
      {onRetry && !denied ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
