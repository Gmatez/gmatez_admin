'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { PaymentRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { DateFilter } from '@/components/shared/filter-bar';
import { Input, Select } from '@/components/ui/fields';
import { Button } from '@/components/ui/button';

export default function PaymentsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['payments', params.toString()],
    queryFn: () =>
      apiGet<PageResult<PaymentRow>>('/admin/payments', {
        page,
        pageSize,
        status: params.get('status'),
        provider: params.get('provider'),
        q: params.get('q'),
        from: params.get('from'),
        to: params.get('to'),
      }),
  });
  return (
    <div>
      <PageHeader
        title="Payments"
        description="Wallet top-ups. Provider secrets and client secrets are not returned."
        actions={
          <Link href="/payments/reconciliation">
            <Button variant="secondary">Reconciliation</Button>
          </Link>
        }
      />
      <div className="filter-bar">
        <Input className="filter-search" aria-label="Search payments" defaultValue={params.get('q') ?? ''} placeholder="Payment id or provider reference" onBlur={(e) => setParams({ q: e.target.value || null }, true)} />
        <Select aria-label="Payment status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
          <option value="">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="REQUIRES_ACTION">Requires action</option>
          <option value="SUCCEEDED">Succeeded</option>
          <option value="FAILED">Failed</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
        <Input aria-label="Provider" defaultValue={params.get('provider') ?? ''} placeholder="Provider" onBlur={(e) => setParams({ provider: e.target.value || null }, true)} />
        <DateFilter label="From" aria-label="From" value={params.get('from') ?? ''} onChange={(e) => setParams({ from: e.target.value || null }, true)} />
        <DateFilter label="To" aria-label="To" value={params.get('to') ?? ''} onChange={(e) => setParams({ to: e.target.value || null }, true)} />
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No payments" body="No payments match these filters." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/payments/${row.id}`)}
            columns={[
              { key: 'id', header: 'Payment', cell: (row) => row.id.slice(0, 8) },
              { key: 'user', header: 'User', cell: (row) => row.user.profile?.displayName ?? row.user.email },
              { key: 'amount', header: 'Amount', align: 'right', cell: (row) => formatMoney(row.amountCents, row.currency) },
              { key: 'provider', header: 'Provider', cell: (row) => row.provider },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'ref', header: 'Reference', cell: (row) => row.providerPaymentId },
              { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
    </div>
  );
}
