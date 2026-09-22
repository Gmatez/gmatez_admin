'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatDuration, formatMoney } from '@/lib/money';
import type { CallRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Input, Select } from '@/components/ui/fields';

const CALL_STATUSES = ['INITIATED','RINGING','ACCEPTED','CONNECTING','CONNECTED','REJECTED','TIMEOUT','CANCELLED','FAILED','ENDED'];

export default function CallsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['calls', params.toString()],
    queryFn: () =>
      apiGet<PageResult<CallRow>>('/admin/calls', {
        page,
        pageSize,
        status: params.get('status'),
        callType: params.get('callType'),
        settlement: params.get('settlement'),
        q: params.get('q'),
        from: params.get('from'),
        to: params.get('to'),
        userId: params.get('userId'),
        hostId: params.get('hostId'),
      }),
  });
  return (
    <div>
      <PageHeader title="Calls" description="Operational call list. Settlement status is derived by the backend from the call lifecycle." />
      <div className="mb-4 flex flex-wrap gap-2">
        <Input aria-label="Search calls" defaultValue={params.get('q') ?? ''} placeholder="Name or id" onBlur={(e) => setParams({ q: e.target.value || null }, true)} />
        <Select aria-label="Call status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
          <option value="">All statuses</option>
          {CALL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}
        </Select>
        <Select aria-label="Call type" value={params.get('callType') ?? ''} onChange={(e) => setParams({ callType: e.target.value || null }, true)}>
          <option value="">Voice and video</option>
          <option value="VOICE">Voice</option>
          <option value="VIDEO">Video</option>
        </Select>
        <Select aria-label="Settlement" value={params.get('settlement') ?? ''} onChange={(e) => setParams({ settlement: e.target.value || null }, true)}>
          <option value="">Any settlement</option>
          <option value="PENDING">Pending</option>
          <option value="SETTLED">Settled</option>
          <option value="NOT_APPLICABLE">Not applicable</option>
        </Select>
        <Input aria-label="From" type="date" value={params.get('from') ?? ''} onChange={(e) => setParams({ from: e.target.value || null }, true)} />
        <Input aria-label="To" type="date" value={params.get('to') ?? ''} onChange={(e) => setParams({ to: e.target.value || null }, true)} />
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No calls" body="No calls match these filters." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/calls/${row.id}`)}
            columns={[
              { key: 'id', header: 'Call', cell: (row) => row.id.slice(0, 8) },
              { key: 'caller', header: 'Caller', cell: (row) => row.callerDisplayName ?? row.callerId.slice(0, 8) },
              { key: 'host', header: 'Host', cell: (row) => row.calleeDisplayName ?? row.calleeId.slice(0, 8) },
              { key: 'type', header: 'Type', cell: (row) => row.callType },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'settle', header: 'Settlement', cell: (row) => <StatusBadge value={row.settlementStatus} /> },
              { key: 'duration', header: 'Duration', align: 'right', cell: (row) => formatDuration(row.billedSeconds) },
              { key: 'amount', header: 'Billed', align: 'right', cell: (row) => formatMoney(row.billedAmountCents) },
              { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
              { key: 'ended', header: 'Ended', cell: (row) => formatWhen(row.endedAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(next) => setParams({ page: String(next) })} />
        </>
      ) : null}
    </div>
  );
}
