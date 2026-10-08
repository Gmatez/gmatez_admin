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
    <div className="space-y-4">
      <PageHeader title="Health" description="Admin view of API dependencies. Connection strings are not shown." />
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <div className="border-b border-slate-100 px-5 py-4 dark:border-slate-800">
          <h2 className="text-lg font-semibold">System status</h2>
        </div>
        <Row label="API" value={data.api} />
        <Row label="Database" value={data.database} />
        <Row label="Redis" value={data.redis} />
        <Row label="Queues" value={data.queues.status} />
      </section>
      {data.queues.notifications ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Notifications queue waiting {data.queues.notifications.waiting ?? 0}, failed {data.queues.notifications.failed ?? 0}
        </p>
      ) : null}
      {data.queues.callLifecycle ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300">
          Call lifecycle queue waiting {data.queues.callLifecycle.waiting ?? 0}, failed {data.queues.callLifecycle.failed ?? 0}
        </p>
      ) : null}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-5 py-4 first:border-t-0 dark:border-slate-800">
      <span className="font-medium text-slate-800 dark:text-slate-100">{label}</span>
      <StatusBadge value={value} />
    </div>
  );
}
