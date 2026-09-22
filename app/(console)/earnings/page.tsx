'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import { formatBps, formatMoney } from '@/lib/money';
import type { MoneyTotals, PayoutRules } from '@/types/admin';
import { Metric, PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';

type Earnings = MoneyTotals & {
  creatorShareBps: number;
  earningReversalsCents: number;
  netCreatorEarningsCents: number;
  paidOutCents: number;
  paidOutCount: number;
  pendingPayoutCents: number;
  pendingPayoutCount: number;
  rules: PayoutRules;
};

export default function EarningsPage() {
  const query = useQuery({
    queryKey: ['earnings'],
    queryFn: () => apiGet<Earnings>('/admin/earnings'),
  });
  if (query.isLoading) return <PageSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const data = query.data;
  if (!data) return null;
  return (
    <div>
      <PageHeader
        title="Earnings"
        description={`Configured host share is ${formatBps(data.creatorShareBps)} (${data.creatorShareBps} basis points). Figures are ledger sums, not a recalculated percentage.`}
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <Metric label="Gross call charges" value={formatMoney(data.callChargesCents)} />
        <Metric label="Host share" value={formatMoney(data.creatorEarningsCents)} />
        <Metric label="Platform share" value={formatMoney(data.platformShareCents)} />
        <Metric label="Refunds" value={formatMoney(data.refundsCents)} />
        <Metric label="Earning reversals" value={formatMoney(data.earningReversalsCents)} />
        <Metric label="Net host earnings" value={formatMoney(data.netCreatorEarningsCents)} />
        <Metric label="Pending payouts" value={formatMoney(data.pendingPayoutCents)} hint={`${data.pendingPayoutCount} open`} />
        <Metric label="Paid payouts" value={formatMoney(data.paidOutCents)} hint={`${data.paidOutCount} completed`} />
        <Metric label="Minimum payout" value={formatMoney(data.rules.minimumAmountCents)} hint={data.rules.payoutRailCode} />
      </div>
    </div>
  );
}
