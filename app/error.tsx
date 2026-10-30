'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] unhandled render error', error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="mt-2 text-sm text-slate-500">
        This page hit an unexpected error. You can try again, or go back to the dashboard.
      </p>
      {error.digest ? (
        <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
        >
          Try again
        </button>
        <a
          href="/dashboard"
          className="rounded-md px-4 py-2 text-sm font-semibold text-slate-600 underline"
        >
          Back to dashboard
        </a>
      </div>
    </main>
  );
}
