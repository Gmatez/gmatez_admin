'use client';

import Link from 'next/link';
import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { PaymentDetail } from '@/types/admin';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { DataTable } from '@/components/tables/data-table';

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const payment = useQuery({
    queryKey: ['payment', id],
    queryFn: () => apiGet<PaymentDetail>(`/admin/payments/${id}`),
  });
  if (payment.isLoading) return <PageSkeleton />;
  if (payment.error) return <ErrorState error={payment.error} onRetry={() => payment.refetch()} />;
  const record = payment.data;
  if (!record) return null;
  return (
    <div className="space-y-6">
      <PageHeader title="Payment" description={record.id} />
      <StatusBadge value={record.status} />
      <section className="text-sm">
        <p>User <Link className="text-teal-800 underline" href={`/users/${record.userId}`}>{record.user.profile?.displayName ?? record.user.email}</Link></p>
        <p>Amount {formatMoney(record.amountCents, record.currency)}</p>
        <p>Provider {record.provider}</p>
        <p>Reference {record.providerPaymentId}</p>
        <p>Failure {record.failureReason ?? '—'}</p>
        <p>Created {formatWhen(record.createdAt)} · Updated {formatWhen(record.updatedAt)}</p>
        <p className="text-stone-500">Webhook payloads and client secrets are not shown.</p>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Wallet credit</h2>
        {record.ledger.length === 0 ? <p className="text-sm text-stone-500">No ledger entry is linked to this payment yet.</p> : (
          <DataTable
            rows={record.ledger}
            rowKey={(row) => row.id}
            columns={[
              { key: 'when', header: 'When', cell: (row) => formatWhen(row.createdAt) },
              { key: 'type', header: 'Type', cell: (row) => row.type },
              { key: 'reason', header: 'Reason', cell: (row) => row.reason },
              { key: 'amount', header: 'Amount', align: 'right', cell: (row) => formatMoney(row.amountCents, record.currency) },
              { key: 'after', header: 'Balance after', align: 'right', cell: (row) => formatMoney(row.balanceAfterCents, record.currency) },
            ]}
          />
        )}
      </section>
    </div>
  );
}
