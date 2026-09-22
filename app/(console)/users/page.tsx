'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { AdminUser } from '@/types/admin';
import { useDebounced, useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Input, Select } from '@/components/ui/fields';

export default function UsersPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const [q, setQ] = useState(params.get('q') ?? '');
  const debounced = useDebounced(q);
  useEffect(() => {
    if (debounced !== (params.get('q') ?? '')) {
      setParams({ q: debounced || null }, true);
    }
  }, [debounced, params, setParams]);

  const query = useQuery({
    queryKey: ['users', params.toString()],
    queryFn: () =>
      apiGet<PageResult<AdminUser>>('/admin/users', {
        page,
        pageSize,
        q: params.get('q'),
        status: params.get('status'),
        from: params.get('from'),
        to: params.get('to'),
        sort: params.get('sort') ?? 'createdAt',
        dir: params.get('dir') ?? 'desc',
      }),
  });

  return (
    <div>
      <PageHeader
        title="Users"
        description="Accounts on the calling platform. Balances are the wallet cache maintained with the ledger."
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input
          aria-label="Search users"
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Name, phone, email, or id"
          className="max-w-xs"
        />
        <Select
          aria-label="Account status"
          value={params.get('status') ?? ''}
          onChange={(event) => setParams({ status: event.target.value || null }, true)}
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="DELETED">Deleted</option>
        </Select>
        <Input
          aria-label="Created from"
          type="date"
          value={params.get('from') ?? ''}
          onChange={(event) => setParams({ from: event.target.value || null }, true)}
        />
        <Input
          aria-label="Created to"
          type="date"
          value={params.get('to') ?? ''}
          onChange={(event) => setParams({ to: event.target.value || null }, true)}
        />
        <Select
          aria-label="Sort"
          value={`${params.get('sort') ?? 'createdAt'}:${params.get('dir') ?? 'desc'}`}
          onChange={(event) => {
            const [sort, dir] = event.target.value.split(':');
            setParams({ sort, dir }, true);
          }}
        >
          <option value="createdAt:desc">Newest</option>
          <option value="createdAt:asc">Oldest</option>
          <option value="email:asc">Email</option>
          <option value="status:asc">Status</option>
        </Select>
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data && query.data.items.length === 0 ? (
        <EmptyState title="No users" body="No accounts match these filters." />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/users/${row.id}`)}
            columns={[
              { key: 'name', header: 'Name', cell: (row) => row.profile?.displayName ?? '—' },
              { key: 'phone', header: 'Phone', cell: (row) => row.phone ?? '—' },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              {
                key: 'host',
                header: 'Host',
                cell: (row) => <StatusBadge value={row.hostProfile?.status ?? 'NOT_HOST'} />,
              },
              {
                key: 'wallet',
                header: 'Available',
                align: 'right',
                cell: (row) =>
                  row.wallet
                    ? formatMoney(row.wallet.availableBalanceCents, row.wallet.currency)
                    : '—',
              },
              {
                key: 'active',
                header: 'Last active',
                cell: (row) => formatWhen(row.profile?.lastActiveAt),
              },
              { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
            ]}
          />
          <Pagination
            page={query.data.page}
            pageSize={query.data.pageSize}
            total={query.data.total}
            onPage={(next) => setParams({ page: String(next) })}
          />
        </>
      ) : null}
    </div>
  );
}
