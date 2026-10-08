'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, type PageResult } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import type { AuditRow } from '@/types/admin';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { DateFilter } from '@/components/shared/filter-bar';
import { Input } from '@/components/ui/fields';

export default function AuditPage() {
  const { params, page, pageSize, setParams } = useUrlFilters();
  const query = useQuery({
    queryKey: ['audit', params.toString()],
    queryFn: () =>
      apiGet<PageResult<AuditRow>>('/admin/audit-logs', {
        page,
        pageSize,
        actorId: params.get('actorId'),
        action: params.get('action'),
        targetType: params.get('targetType'),
        targetId: params.get('targetId'),
        from: params.get('from'),
        to: params.get('to'),
      }),
  });
  return (
    <div>
      <PageHeader
        title="Audit logs"
        description="Read only. Rows are written when an admin action succeeds. Failed attempts are not stored."
      />
      <div className="filter-bar">
        <Input aria-label="Admin id" placeholder="Admin id" defaultValue={params.get('actorId') ?? ''} onBlur={(e) => setParams({ actorId: e.target.value || null }, true)} />
        <Input aria-label="Action" placeholder="Action" defaultValue={params.get('action') ?? ''} onBlur={(e) => setParams({ action: e.target.value || null }, true)} />
        <Input aria-label="Entity type" placeholder="Entity type" defaultValue={params.get('targetType') ?? ''} onBlur={(e) => setParams({ targetType: e.target.value || null }, true)} />
        <Input aria-label="Entity id" placeholder="Entity id" defaultValue={params.get('targetId') ?? ''} onBlur={(e) => setParams({ targetId: e.target.value || null }, true)} />
        <DateFilter label="From" aria-label="From" value={params.get('from') ?? ''} onChange={(e) => setParams({ from: e.target.value || null }, true)} />
        <DateFilter label="To" aria-label="To" value={params.get('to') ?? ''} onChange={(e) => setParams({ to: e.target.value || null }, true)} />
      </div>
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.items.length === 0 ? <EmptyState title="No audit events" body="No records match these filters." /> : null}
      {query.data && query.data.items.length > 0 ? (
        <>
          <DataTable
            rows={query.data.items}
            rowKey={(row) => row.id}
            columns={[
              { key: 'when', header: 'When', cell: (row) => formatWhen(row.createdAt) },
              { key: 'admin', header: 'Admin', cell: (row) => row.actor?.email ?? row.actorId ?? '—' },
              { key: 'action', header: 'Action', cell: (row) => row.action },
              { key: 'entity', header: 'Entity', cell: (row) => `${row.targetType} ${row.targetId.slice(0, 8)}` },
              { key: 'result', header: 'Result', cell: () => 'recorded' },
              { key: 'reason', header: 'Reason', cell: (row) => String(row.metadata?.reason ?? row.metadata?.reviewNote ?? '—') },
              { key: 'meta', header: 'Summary', cell: (row) => summarize(row.metadata) },
            ]}
          />
          <Pagination page={query.data.page} pageSize={query.data.pageSize} total={query.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
    </div>
  );
}

function summarize(metadata: Record<string, unknown> | null): string {
  if (!metadata) return '—';
  const entries = Object.entries(metadata).filter(([key]) => !/token|secret|password/i.test(key));
  return entries.map(([key, value]) => `${key}: ${String(value)}`).join(' · ') || '—';
}
