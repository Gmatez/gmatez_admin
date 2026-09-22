'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import { formatBps, formatMoney } from '@/lib/money';
import type { AnalyticsResponse, DashboardResponse } from '@/types/admin';
import { Metric, PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';

const OpsCharts = dynamic(
  () => import('@/components/charts/ops-charts').then((mod) => mod.OpsCharts),
  { ssr: false, loading: () => <PageSkeleton /> },
);

export default function DashboardPage() {
  const dashboard = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => apiGet<DashboardResponse>('/admin/dashboard'),
  });
  const analytics = useQuery({
    queryKey: ['analytics', 14],
    queryFn: () => apiGet<AnalyticsResponse>('/admin/analytics', { days: 14 }),
  });

  if (dashboard.isLoading) return <PageSkeleton />;
  if (dashboard.error) {
    return <ErrorState error={dashboard.error} onRetry={() => dashboard.refetch()} />;
  }
  const data = dashboard.data;
  if (!data) return null;
  const calls = data.calls.byStatus;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations"
        description={`Live counts from the Gmatez ledger and call records. Host share is ${formatBps(data.creatorShareBps)} (${data.creatorShareBps} bps). Money is integer minor units; the wallet default currency is USD and these totals are not FX-converted.`}
      />
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Users</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total" value={String(data.users.total)} />
          <Metric label="Active accounts" value={String(data.users.byStatus.ACTIVE ?? 0)} />
          <Metric label="New today" value={String(data.users.newToday)} hint={`${data.users.newLast7Days} in 7 days`} />
          <Metric label="Active in 24h" value={String(data.users.recentlyActive24h)} />
          <Metric label="Suspended / deleted" value={`${data.users.byStatus.SUSPENDED ?? 0} / ${data.users.byStatus.DELETED ?? 0}`} />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Hosts</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total" value={String(data.hosts.total)} />
          <Metric label="Pending review" value={String(data.hosts.byStatus.PENDING_REVIEW ?? 0)} />
          <Metric label="Active" value={String(data.hosts.byStatus.ACTIVE ?? 0)} />
          <Metric label="Online" value={String(data.hosts.online)} hint={`Paused ${data.hosts.byAvailability.PAUSED ?? 0}`} />
          <Metric label="Suspended" value={String(data.hosts.byStatus.SUSPENDED ?? 0)} />
          <Metric label="Rejected" value={String(data.hosts.byStatus.REJECTED ?? 0)} />
          <Metric label="Offline" value={String(data.hosts.byAvailability.OFFLINE ?? 0)} />
          <Metric label="Busy" value={String(data.hosts.byAvailability.BUSY ?? 0)} />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Calls</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Total" value={String(data.calls.total)} />
          <Metric label="Active" value={String(data.calls.active)} />
          <Metric label="Ended" value={String(calls.ENDED ?? 0)} />
          <Metric label="Failed" value={String(calls.FAILED ?? 0)} />
          <Metric label="Cancelled" value={String(calls.CANCELLED ?? 0)} />
          <Metric label="Timeout" value={String(calls.TIMEOUT ?? 0)} hint="Missed / unanswered timeout" />
          <Metric label="Rejected" value={String(calls.REJECTED ?? 0)} />
          <Metric label="Voice / video" value={`${data.calls.byType.VOICE ?? 0} / ${data.calls.byType.VIDEO ?? 0}`} />
        </div>
      </section>
      <section>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone-500">Financial</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric label="Available balances" value={formatMoney(data.financial.availableBalanceCents)} />
          <Metric label="Held balances" value={formatMoney(data.financial.heldBalanceCents)} />
          <Metric label="Deposits" value={formatMoney(data.financial.depositsCents)} />
          <Metric label="Call billing" value={formatMoney(data.financial.callChargesCents)} />
          <Metric label="Host earnings" value={formatMoney(data.financial.creatorEarningsCents)} />
          <Metric label="Platform share" value={formatMoney(data.financial.platformShareCents)} />
          <Metric label="Refunds" value={formatMoney(data.financial.refundsCents)} />
          <Metric label="Pending payouts" value={formatMoney(data.payouts.pendingAmountCents)} hint={`${data.payouts.pendingCount} requests`} />
        </div>
      </section>
      {analytics.data ? <OpsCharts data={analytics.data} /> : null}
      {analytics.error ? <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} /> : null}
    </div>
  );
}
