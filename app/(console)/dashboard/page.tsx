'use client';

import dynamic from 'next/dynamic';
import { useQuery } from '@tanstack/react-query';
import { Banknote, Headset, Phone, Users } from 'lucide-react';
import { apiGet } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatBps, formatMoney } from '@/lib/money';
import type { AnalyticsResponse, DashboardResponse } from '@/types/admin';
import { Metric, PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';

const OpsCharts = dynamic(
  () => import('@/components/charts/ops-charts').then((mod) => mod.OpsCharts),
  { ssr: false, loading: () => <PageSkeleton /> },
);

function periodDelta(values: number[]) {
  if (values.length < 2) return null;
  const mid = Math.floor(values.length / 2);
  const previous = values.slice(0, mid).reduce((sum, value) => sum + value, 0);
  const current = values.slice(mid).reduce((sum, value) => sum + value, 0);
  if (previous <= 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

function Delta({ pct }: { pct: number | null }) {
  if (pct === null) return null;
  const up = pct >= 0;
  return (
    <span className={up ? 'font-semibold text-emerald-600' : 'font-semibold text-red-600'}>
      {up ? '↑' : '↓'} {Math.abs(pct)}%
    </span>
  );
}

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
  const registrationDelta = analytics.data
    ? periodDelta(analytics.data.registrationsPerDay.map((row) => row.count))
    : null;
  const callDelta = analytics.data ? periodDelta(analytics.data.callsPerDay.map((row) => row.total)) : null;
  const earningsDelta = analytics.data
    ? periodDelta(analytics.data.moneyPerDay.map((row) => row.creatorEarningsCents))
    : null;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Overview of your Gmatez platform" />
      <section className="gm-metrics grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Metric
          icon={<Users />}
          label="Total users"
          value={String(data.users.total)}
          hint={
            <>
              <Delta pct={registrationDelta} /> {data.users.newLast7Days} new in 7 days
            </>
          }
        />
        <Metric
          icon={<Headset />}
          label="Total hosts"
          value={String(data.hosts.total)}
          hint={`${data.hosts.byStatus.PENDING_REVIEW ?? 0} pending review`}
        />
        <Metric
          icon={<Phone />}
          label="Total calls"
          value={String(data.calls.total)}
          hint={
            <>
              <Delta pct={callDelta} /> {data.calls.active} active now
            </>
          }
        />
        <Metric
          icon={<Banknote />}
          label="Host earnings"
          value={formatMoney(data.financial.creatorEarningsCents)}
          hint={
            <>
              <Delta pct={earningsDelta} /> platform {formatMoney(data.financial.platformShareCents)}
            </>
          }
        />
        <Metric
          icon={<Banknote />}
          label="Pending payouts"
          value={formatMoney(data.payouts.pendingAmountCents)}
          hint={`${data.payouts.pendingCount} requests`}
        />
      </section>

      {analytics.data ? <OpsCharts data={analytics.data} /> : analytics.isLoading ? <PageSkeleton /> : null}
      {analytics.error ? <ErrorState error={analytics.error} onRetry={() => analytics.refetch()} /> : null}

      <section className="gm-panel p-5">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">Platform snapshot</h2>
        <p className="mt-1 text-sm text-slate-500">
          Host share {formatBps(data.creatorShareBps)} ({data.creatorShareBps} bps). Generated {formatWhen(data.generatedAt)}.
          Money stays in integer minor units. Wallet totals use the stored currency and are not FX-converted.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <CountList title="Reports" counts={data.reports.byStatus} />
          <CountList title="Payments" counts={data.payments.byStatus} />
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Users</h2>
        <div className="gm-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Metric label="Total" value={String(data.users.total)} />
          <Metric label="Active accounts" value={String(data.users.byStatus.ACTIVE ?? 0)} />
          <Metric label="New today" value={String(data.users.newToday)} hint={`${data.users.newLast7Days} in 7 days`} />
          <Metric label="Active in 24h" value={String(data.users.recentlyActive24h)} />
          <Metric label="Suspended / deleted" value={`${data.users.byStatus.SUSPENDED ?? 0} / ${data.users.byStatus.DELETED ?? 0}`} />
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Hosts</h2>
        <div className="gm-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Calls</h2>
        <div className="gm-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        <h2 className="mb-3 text-lg font-semibold text-slate-900 dark:text-slate-50">Financial</h2>
        <div className="gm-metrics grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
    </div>
  );
}

function CountList({ title, counts }: { title: string; counts: Record<string, number> }) {
  const entries = Object.entries(counts);
  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">{title}</h3>
      {entries.length === 0 ? <p className="mt-2 text-sm text-slate-500">None recorded.</p> : null}
      <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
        {entries.map(([status, count]) => (
          <li key={status} className="flex items-center justify-between gap-3">
            <span>{status.replaceAll('_', ' ')}</span>
            <span className="tabular-nums font-medium text-slate-900 dark:text-slate-50">{count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
