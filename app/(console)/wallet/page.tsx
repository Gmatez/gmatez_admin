'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { WalletRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Input } from '@/components/ui/fields';

export default function WalletsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['wallets', params.toString()],
    queryFn: () => apiGet<PageResult<WalletRow>>('/admin/wallets', { page, pageSize, q: params.get('q') }),
  });
  return (
    <div>
      <PageHeader title="Wallets" description="Available and held balances are transactional caches. History is the ledger." />
      <Input className="mb-4 max-w-xs" aria-label="Search wallets" defaultValue={params.get('q') ?? ''} placeholder="Name, phone, email, or id" onBlur={(e) => setParams({ q: e.target.value || null }, true)} />
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No wallets" body="No wallets match this search." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/wallet/${row.userId}`)}
            columns={[
              { key: 'user', header: 'User', cell: (row) => row.user.profile?.displayName ?? row.user.email },
              { key: 'phone', header: 'Phone', cell: (row) => row.user.phone ?? '—' },
              { key: 'available', header: 'Available', align: 'right', cell: (row) => formatMoney(row.availableBalanceCents, row.currency) },
              { key: 'held', header: 'Held', align: 'right', cell: (row) => formatMoney(row.heldBalanceCents, row.currency) },
              { key: 'updated', header: 'Updated', cell: (row) => formatWhen(row.updatedAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
    </div>
  );
}
