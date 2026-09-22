'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import type { ReportRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Select } from '@/components/ui/fields';

export default function ReportsPage() {
  const router = useRouter();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['reports', params.toString()],
    queryFn: () => apiGet<PageResult<ReportRow>>('/admin/reports', { page, pageSize, status: params.get('status'), reason: params.get('reason') }),
  });
  return (
    <div>
      <PageHeader title="Reports" description="Trust and safety queue. Actions are the report statuses the backend accepts." />
      <div className="mb-4 flex gap-2">
        <Select aria-label="Report status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
          <option value="">All statuses</option>
          <option value="OPEN">Open</option>
          <option value="UNDER_REVIEW">Under review</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </Select>
        <Select aria-label="Reason" value={params.get('reason') ?? ''} onChange={(e) => setParams({ reason: e.target.value || null }, true)}>
          <option value="">All reasons</option>
          <option value="HARASSMENT">Harassment</option>
          <option value="SPAM">Spam</option>
          <option value="INAPPROPRIATE_CONTENT">Inappropriate content</option>
          <option value="FRAUD">Fraud</option>
          <option value="OTHER">Other</option>
        </Select>
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No reports" body="The queue is empty for these filters." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            onRow={(row) => router.push(`/reports/${row.id}`)}
            columns={[
              { key: 'id', header: 'Report', cell: (row) => row.id.slice(0, 8) },
              { key: 'reporter', header: 'Reporter', cell: (row) => row.reporter?.profile?.displayName ?? row.reporterId.slice(0, 8) },
              { key: 'reported', header: 'Reported', cell: (row) => row.reported?.profile?.displayName ?? row.reportedId.slice(0, 8) },
              { key: 'reason', header: 'Category', cell: (row) => row.reason },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
    </div>
  );
}
