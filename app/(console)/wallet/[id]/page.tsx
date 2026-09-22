'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { apiGet } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { Reconciliation, WalletRow } from '@/types/admin';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';

type Ledger = {
  items: Array<{
    id: string;
    type: string;
    reason: string;
    amountCents: number;
    balanceAfterCents: number;
    createdAt: string;
  }>;
};

export default function WalletDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const wallets = useQuery({
    queryKey: ['wallet-user', id],
    queryFn: () => apiGet<{ items: WalletRow[] }>('/admin/wallets', { q: id, page: 1, pageSize: 5 }),
  });
  const ledger = useQuery({
    queryKey: ['ledger', id],
    queryFn: () => apiGet<Ledger>(`/admin/users/${id}/ledger`, { limit: 50 }),
  });
  const reconcile = useQuery({
    queryKey: ['reconcile', id],
    queryFn: () => apiGet<Reconciliation>(`/admin/users/${id}/wallet/reconcile`),
  });
  if (wallets.isLoading) return <PageSkeleton />;
  if (wallets.error) return <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />;
  const wallet = wallets.data?.items.find((item) => item.userId === id) ?? wallets.data?.items[0];
  const currency = wallet?.currency ?? reconcile.data?.currency ?? 'USD';
  return (
    <div className="space-y-4">
      <PageHeader title="Wallet" description={id} actions={<Link className="text-sm text-teal-800 underline" href={`/users/${id}`}>Open user</Link>} />
      {wallet ? (
        <p className="text-sm">
          Available {formatMoney(wallet.availableBalanceCents, currency)} · Held {formatMoney(wallet.heldBalanceCents, currency)}
        </p>
      ) : (
        <p className="text-sm">Wallet row was not found for this id.</p>
      )}
      {reconcile.data ? (
        <p className="text-sm">
          <StatusBadge value={reconcile.data.ok ? 'ok' : 'error'} /> Ledger net {formatMoney(reconcile.data.ledgerNetCents, currency)}
          {reconcile.data.issues.length ? ` · ${reconcile.data.issues.join(', ')}` : ''}
        </p>
      ) : null}
      {ledger.data ? (
        <DataTable
          rows={ledger.data.items}
          rowKey={(row) => row.id}
          columns={[
            { key: 'when', header: 'When', cell: (row) => formatWhen(row.createdAt) },
            { key: 'reason', header: 'Reason', cell: (row) => `${row.type} ${row.reason}` },
            { key: 'amount', header: 'Amount', align: 'right', cell: (row) => formatMoney(row.type === 'DEBIT' ? -row.amountCents : row.amountCents, currency) },
            { key: 'after', header: 'After', align: 'right', cell: (row) => formatMoney(row.balanceAfterCents, currency) },
          ]}
        />
      ) : null}
    </div>
  );
}
