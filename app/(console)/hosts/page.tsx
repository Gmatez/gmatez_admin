'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import type { HostRecord } from '@/types/admin';
import { useDebounced, useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { PersonCell } from '@/components/shared/person';
import { Button } from '@/components/ui/button';
import { Input, Select } from '@/components/ui/fields';

export default function HostsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const [q, setQ] = useState(params.get('q') ?? '');
  const debounced = useDebounced(q);
  useEffect(() => {
    if (debounced !== (params.get('q') ?? '')) setParams({ q: debounced || null }, true);
  }, [debounced, params, setParams]);
  const query = useQuery({
    queryKey: ['hosts', params.toString()],
    queryFn: () =>
      apiGet<PageResult<HostRecord>>('/admin/hosts', {
        page,
        pageSize,
        q: params.get('q'),
        status: params.get('status'),
        availability: params.get('availability'),
        verificationStatus: params.get('verificationStatus'),
        incomplete: params.get('incomplete'),
      }),
  });
  return (
    <div>
      <PageHeader
        title="Hosts"
        description="Review applications and operate the host state machine. Availability filters are live host state, not a separate approval status."
      />
      <div className="filter-bar">
        <Input aria-label="Search hosts" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, phone, email" className="filter-search" />
        <Select aria-label="Host status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
          <option value="">All review states</option>
          <option value="PENDING_REVIEW">Pending</option>
          <option value="ACTIVE">Active</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </Select>
        <Select aria-label="Availability" value={params.get('availability') ?? ''} onChange={(e) => setParams({ availability: e.target.value || null }, true)}>
          <option value="">Any availability</option>
          <option value="ONLINE">Online</option>
          <option value="PAUSED">Paused</option>
          <option value="OFFLINE">Offline</option>
          <option value="BUSY">Busy</option>
        </Select>
        <Select aria-label="Verification" value={params.get('verificationStatus') ?? ''} onChange={(e) => setParams({ verificationStatus: e.target.value || null }, true)}>
          <option value="">Any verification</option>
          <option value="NOT_REQUIRED">Not required</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </Select>
        <Select aria-label="Completeness" value={params.get('incomplete') ?? ''} onChange={(e) => setParams({ incomplete: e.target.value || null }, true)}>
          <option value="">Any completeness</option>
          <option value="true">Likely incomplete</option>
        </Select>
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? (
        <EmptyState
          title="No hosts found"
          body="There are no hosts matching your current filters."
          action={
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setQ('');
                setParams({ q: null, status: null, availability: null, verificationStatus: null, incomplete: null }, true);
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.userId}
            onRow={(row) => router.push(`/hosts/${row.userId}`)}
            columns={[
              { key: 'name', header: 'Name', cell: (row) => <PersonCell name={row.user.profile?.displayName ?? '—'} /> },
              { key: 'phone', header: 'Phone', cell: (row) => row.user.phone ?? '—' },
              { key: 'status', header: 'Host status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'verify', header: 'Verification', cell: (row) => <StatusBadge value={row.verificationStatus} /> },
              { key: 'avail', header: 'Availability', cell: (row) => <StatusBadge value={row.availability} /> },
              { key: 'complete', header: 'Completeness', cell: (row) => `${row.completeness?.percentage ?? 0}%` },
              { key: 'created', header: 'Submitted', cell: (row) => formatWhen(row.submittedAt) },
              { key: 'updated', header: 'Updated', cell: (row) => formatWhen(row.updatedAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(next) => setParams({ page: String(next) })} />
        </>
      ) : null}
    </div>
  );
}
