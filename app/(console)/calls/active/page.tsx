'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import { DataTable } from '@/components/tables/data-table';
import { PageHeader } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';

type ActiveCall = {
  id: string;
  callType: string;
  connectedAt: string;
  ratePerMinuteCents: number;
  billedSeconds: number;
  caller: { id: string; displayName: string | null; availableBalanceCents: number };
  host: { id: string; displayName: string | null; availableBalanceCents: number };
};

function elapsedSeconds(connectedAt: string, now: number): number {
  const started = new Date(connectedAt).getTime();
  return Math.max(0, Math.floor((now - started) / 1000));
}

function mmss(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function ActiveCallsPage() {
  // Server truth (participants, rate, confirmed billedSeconds) refreshes
  // every 5s — the established "near-live" pattern in this codebase
  // (calls/[id]/page.tsx) since no realtime/websocket client exists here.
  // The on-screen duration itself ticks every 1s locally, computed from
  // connectedAt, so it doesn't look frozen between polls.
  const query = useQuery({
    queryKey: ['calls', 'active'],
    queryFn: () => apiGet<ActiveCall[]>('/admin/calls/active'),
    refetchInterval: 5000,
  });
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div>
      <PageHeader
        title="Calls — live now"
        description="Connected calls, refreshed every 5 seconds. Estimated cost is a running total, not yet billed — the authoritative amount is settled when the call ends."
      />
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.length === 0 ? (
        <EmptyState title="No calls in progress" body="Connected calls will appear here as they happen." />
      ) : null}
      {query.data && query.data.length > 0 ? (
        <DataTable
          rows={query.data}
          rowKey={(row) => row.id}
          columns={[
            { key: 'type', header: 'Type', cell: (row) => row.callType },
            {
              key: 'caller',
              header: 'Caller',
              cell: (row) => (
                <div>
                  <div className="font-medium">{row.caller.displayName ?? '—'}</div>
                  <div className="text-xs text-slate-500">
                    Balance {formatMoney(row.caller.availableBalanceCents, 'INR')}
                  </div>
                </div>
              ),
            },
            {
              key: 'host',
              header: 'Host',
              cell: (row) => (
                <div>
                  <div className="font-medium">{row.host.displayName ?? '—'}</div>
                  <div className="text-xs text-slate-500">
                    Balance {formatMoney(row.host.availableBalanceCents, 'INR')}
                  </div>
                </div>
              ),
            },
            {
              key: 'rate',
              header: 'Rate / min',
              align: 'right',
              cell: (row) => formatMoney(row.ratePerMinuteCents, 'INR'),
            },
            {
              key: 'duration',
              header: 'Duration',
              align: 'right',
              cell: (row) => mmss(elapsedSeconds(row.connectedAt, now)),
            },
            {
              key: 'estimate',
              header: 'Est. cost',
              align: 'right',
              cell: (row) => {
                const minutes = elapsedSeconds(row.connectedAt, now) / 60;
                return formatMoney(Math.round(minutes * row.ratePerMinuteCents), 'INR');
              },
            },
          ]}
        />
      ) : null}
    </div>
  );
}
