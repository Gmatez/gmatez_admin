import { Button } from '@/components/ui/button';
import { errorText } from '@/lib/errors';
import { ApiError } from '@/lib/errors';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-stone-200 dark:bg-stone-800 ${className}`}
      aria-hidden
    />
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <SkeletonBlock className="h-8 w-48" />
      <SkeletonBlock className="h-24 w-full" />
      <SkeletonBlock className="h-64 w-full" />
    </div>
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-lg border border-dashed border-stone-300 px-6 py-12 text-center dark:border-stone-700">
      <h2 className="text-base font-semibold text-stone-900 dark:text-stone-100">{title}</h2>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">{body}</p>
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
      className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 dark:border-red-900 dark:bg-red-950/40"
    >
      <h2 className="font-semibold text-red-900 dark:text-red-100">
        {denied ? 'Permission denied' : 'This page could not be loaded'}
      </h2>
      <p className="mt-1 text-sm text-red-800 dark:text-red-200">{errorText(error)}</p>
      {error instanceof ApiError && error.code ? (
        <p className="mt-1 font-mono text-xs text-red-700 dark:text-red-300">{error.code}</p>
      ) : null}
      {onRetry && !denied ? (
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
