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
      <p className="text-sm">Environment {data.environment} · API {data.version} · Host share {formatBps(data.creatorShareBps)}</p>
      <ul className="space-y-2">
        {providers.map(([label, provider]) => (
          <li key={label} className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 text-sm dark:border-stone-800">
            <span>{label} · mode {provider.mode}</span>
            <span className="flex items-center gap-2">
              <StatusBadge value={provider.status} />
              <span className="text-xs text-stone-500">{provider.verification}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
