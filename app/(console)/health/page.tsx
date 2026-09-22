'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import type { SystemStatus } from '@/types/admin';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';

export default function HealthPage() {
  const query = useQuery({
    queryKey: ['system'],
    queryFn: () => apiGet<SystemStatus>('/admin/system'),
    refetchInterval: 20_000,
  });
  if (query.isLoading) return <PageSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  if (!data) return null;
  return (
    <div className="space-y-3">
      <PageHeader title="Health" description="Admin view of API dependencies. Connection strings are not shown." />
      <Row label="API" value={data.api} />
      <Row label="Database" value={data.database} />
      <Row label="Redis" value={data.redis} />
      <Row label="Queues" value={data.queues.status} />
      {data.queues.notifications ? <p className="text-sm">Notifications queue waiting {data.queues.notifications.waiting ?? 0}, failed {data.queues.notifications.failed ?? 0}</p> : null}
      {data.queues.callLifecycle ? <p className="text-sm">Call lifecycle queue waiting {data.queues.callLifecycle.waiting ?? 0}, failed {data.queues.callLifecycle.failed ?? 0}</p> : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-stone-200 px-3 py-2 dark:border-stone-800">
      <span>{label}</span>
      <StatusBadge value={value} />
    </div>
  );
}
