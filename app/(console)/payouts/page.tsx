'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { PayoutRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Select } from '@/components/ui/fields';

export default function PayoutsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['payouts', params.toString()],
    queryFn: () => apiGet<PageResult<PayoutRow>>('/admin/payouts', { page, pageSize, status: params.get('status'), q: params.get('q') }),
  });
  return (
    <div>
      <PageHeader
        title="Payouts"
        description="Marking a payout completed records the operational status. It does not send money: the payout rail is PAYOUT_PROVIDER_CONFIG_REQUIRED."
      />
      <Select className="mb-4" aria-label="Payout status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
        <option value="">All statuses</option>
        <option value="REQUESTED">Requested</option>
        <option value="PROCESSING">Processing</option>
        <option value="COMPLETED">Completed</option>
        <option value="REJECTED">Rejected</option>
        <option value="FAILED">Failed</option>
      </Select>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No payouts" body="No payout requests match this filter." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/payouts/${row.id}`)}
            columns={[
              { key: 'id', header: 'Payout', cell: (row) => row.id.slice(0, 8) },
              { key: 'host', header: 'Host', cell: (row) => row.hostName ?? row.userId.slice(0, 8) },
              { key: 'amount', header: 'Amount', align: 'right', cell: (row) => formatMoney(row.amountCents) },
              { key: 'dest', header: 'Destination', cell: (row) => row.destination ? `${row.destination.type} ${row.destination.label}` : 'Missing' },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'requested', header: 'Requested', cell: (row) => formatWhen(row.createdAt) },
              { key: 'processed', header: 'Processed', cell: (row) => formatWhen(row.processedAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
    </div>
  );
}
