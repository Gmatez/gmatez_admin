'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import { formatBps } from '@/lib/money';
import type { SystemStatus } from '@/types/admin';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';

export default function SettingsPage() {
  const query = useQuery({
    queryKey: ['system'],
    queryFn: () => apiGet<SystemStatus>('/admin/system'),
  });
  if (query.isLoading) return <PageSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  if (!data) return null;
  const providers = [
    ['SMS', data.providers.sms],
    ['Agora', data.providers.agora],
    ['Stripe', data.providers.stripe],
    ['FCM', data.providers.fcm],
    ['Payout', data.providers.payout],
  ] as const;
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" description="Safe configuration status. Secret values are not included." />
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="text-lg font-semibold">General</h2>
        <dl className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Environment</dt>
            <dd className="mt-1 text-sm font-semibold">{data.environment}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">API</dt>
            <dd className="mt-1 text-sm font-semibold">{data.version}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Host share</dt>
            <dd className="mt-1 text-sm font-semibold">{formatBps(data.creatorShareBps)}</dd>
          </div>
        </dl>
      </section>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">Providers</h2>
        </div>
        <ul>
          {providers.map(([label, provider]) => (
            <li key={label} className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm first:border-t-0 dark:border-slate-800">
              <span className="font-medium text-slate-800 dark:text-slate-100">{label} · mode {provider.mode}</span>
              <span className="flex items-center gap-2">
                <StatusBadge value={provider.status} />
                <span className="text-xs text-slate-500">{provider.verification}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
