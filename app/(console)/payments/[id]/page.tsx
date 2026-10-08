'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { PaymentDetail } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useQueryClient();
  const [confirmRefund, setConfirmRefund] = useState(false);
  const payment = useQuery({
    queryKey: ['payment', id],
    queryFn: () => apiGet<PaymentDetail>(`/admin/payments/${id}`),
  });
  const refresh = () => {
    void client.invalidateQueries({ queryKey: ['payment', id] });
  };
  const reconcile = useMutation({
    mutationFn: () => apiSend(`/admin/payments/${id}/reconcile`, 'POST'),
    onSuccess: () => {
      toast.success('Payment compared with Razorpay');
      refresh();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const refund = useMutation({
    mutationFn: () => apiSend(`/admin/payments/${id}/refund`, 'POST'),
    onSuccess: () => {
      toast.success('Refund requested');
      setConfirmRefund(false);
      refresh();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (payment.isLoading) return <PageSkeleton />;
  if (payment.error) return <ErrorState error={payment.error} onRetry={() => payment.refetch()} />;
  const record = payment.data;
  if (!record) return null;
  const canRefund =
    record.provider === 'razorpay' &&
    record.status === 'SUCCEEDED' &&
    record.refundStatus !== 'PROCESSED' &&
    record.refundStatus !== 'PENDING';
  return (
    <div className="space-y-6">
      <PageHeader title="Payment" description={record.id} />
      <StatusBadge value={record.status} />
      <section className="space-y-1 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <p>User <Link className="font-medium text-blue-600 underline" href={`/users/${record.userId}`}>{record.user.profile?.displayName ?? record.user.email}</Link></p>
        <p>Amount {formatMoney(record.amountCents, record.currency)}</p>
        <p>Wallet credit {formatMoney(record.creditCents ?? record.amountCents, record.currency)}</p>
        <p>Provider {record.provider}</p>
        <p>Order {record.providerPaymentId}</p>
        <p>Provider payment {record.providerCaptureId ?? '—'}</p>
        <p>Refund {record.refundStatus ?? 'NONE'} {record.providerRefundId ?? ''}</p>
        <p>Reconciliation {record.reconciliationStatus ?? '—'}</p>
        <p>Failure {record.failureReason ?? '—'}</p>
        <p>Created {formatWhen(record.createdAt)} · Captured {formatWhen(record.capturedAt)} · Updated {formatWhen(record.updatedAt)}</p>
        <p className="text-slate-500">Webhook payloads and client secrets are not shown.</p>
      </section>
      {record.provider === 'razorpay' ? (
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" disabled={reconcile.isPending} onClick={() => reconcile.mutate()}>
            Reconcile with Razorpay
          </Button>
          {canRefund ? (
            <Button variant="danger" onClick={() => setConfirmRefund(true)}>
              Refund captured payment
            </Button>
          ) : null}
        </div>
      ) : null}
      <section>
        <h2 className="mb-2 font-semibold">Wallet credit</h2>
        {record.ledger.length === 0 ? <p className="text-sm text-slate-500">No ledger entry is linked to this payment yet.</p> : (
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
      <ConfirmDialog
        open={confirmRefund}
        title="Refund this Razorpay payment"
        description="This debits the credited wallet amount when the balance can cover it, then asks Razorpay to refund the captured payment. It does not reverse a call."
        confirmLabel="Refund"
        destructive
        pending={refund.isPending}
        onOpenChange={setConfirmRefund}
        onConfirm={() => refund.mutate()}
      />
    </div>
  );
}
