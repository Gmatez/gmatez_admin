'use client';

import { useEffect } from 'react';

/**
 * Catches errors thrown by the root layout itself (app/layout.tsx), which
 * app/error.tsx cannot — it replaces the root layout, so it renders its own
 * <html>/<body> rather than relying on providers/fonts from layout.tsx.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[admin] unhandled root layout error', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="min-h-full antialiased">
        <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-500">
            The admin console failed to load. Try again, or reload the page.
          </p>
          {error.digest ? (
            <p className="mt-2 text-xs text-slate-400">Reference: {error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-4 w-fit rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
