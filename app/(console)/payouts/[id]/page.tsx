'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import type { AuditRow, PayoutRow, PayoutRules } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';

type PayoutDetail = PayoutRow & {
  user: { id: string; email: string; phone: string | null; status: string; profile: { displayName: string } | null };
  audit: AuditRow[];
  rules: PayoutRules;
};

const NEXT: Record<string, string[]> = {
  REQUESTED: ['PROCESSING', 'REJECTED', 'FAILED'],
  PROCESSING: ['REJECTED', 'FAILED'],
  FAILED: ['PROCESSING', 'REJECTED'],
};

export default function PayoutDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useQueryClient();
  const [next, setNext] = useState<string | null>(null);
  const payout = useQuery({
    queryKey: ['payout', id],
    queryFn: () => apiGet<PayoutDetail>(`/admin/payouts/${id}`),
  });
  const mutation = useMutation({
    mutationFn: (input: { status: string; reason: string }) =>
      apiSend(`/admin/payouts/${id}`, 'PATCH', {
        status: input.status,
        failureReason: input.reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Payout status updated');
      setNext(null);
      void client.invalidateQueries({ queryKey: ['payout', id] });
      void client.invalidateQueries({ queryKey: ['payouts'] });
      void client.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (payout.isLoading) return <PageSkeleton />;
  if (payout.error) return <ErrorState error={payout.error} onRetry={() => payout.refetch()} />;
  const record = payout.data;
  if (!record) return null;
  const actions = NEXT[record.status] ?? [];
  return (
    <div className="space-y-4">
      <PageHeader title="Payout" description={record.id} />
      <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <StatusBadge value={record.status} />
      <p>Host <Link className="font-medium text-blue-600 underline" href={`/hosts/${record.userId}`}>{record.user.profile?.displayName ?? record.user.email}</Link></p>
      <p>Amount {formatMoney(record.amountCents)}</p>
      <p>Destination {record.destination ? `${record.destination.type} · ${JSON.stringify(record.destination.detailsMasked)}` : 'None'}</p>
      <p>Requested {formatWhen(record.createdAt)} · Processed {formatWhen(record.processedAt)}</p>
      <p>Failure {record.failureReason ?? '—'}</p>
      <p className="text-amber-800">
        {record.rules.payoutRail ?? 'RAZORPAYX'} is {record.rules.payoutRailStatus}. No bank or UPI transfer is sent.
        External transfer status: {record.rules.externalTransferStatus ?? 'NOT_TRANSFERRED'}.
      </p>
      </section>
      <div className="flex flex-wrap gap-2">
        {actions.map((status) => (
          <Button key={status} variant={status === 'REJECTED' || status === 'FAILED' ? 'danger' : 'primary'} onClick={() => setNext(status)}>
            Mark {status.toLowerCase()}
          </Button>
        ))}
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="mb-2 font-semibold">Audit</h2>
        <ul className="space-y-1 text-sm">
          {record.audit.map((row) => (
            <li key={row.id}>{formatWhen(row.createdAt)} · {row.action} · {row.actor?.email ?? 'system'}</li>
          ))}
        </ul>
      </section>
      <ConfirmDialog
        open={next !== null}
        title={`Mark payout ${next ?? ''}`}
        description="Rejecting or failing a payout credits the amount back to the host wallet. This screen cannot mark a payout completed, because no external transfer has been made."
        confirmLabel="Confirm"
        destructive={next === 'REJECTED' || next === 'FAILED'}
        requireReason={next === 'REJECTED' || next === 'FAILED'}
        pending={mutation.isPending}
        onOpenChange={(open) => { if (!open) setNext(null); }}
        onConfirm={(reason) => { if (next) mutation.mutate({ status: next, reason }); }}
      />
    </div>
  );
}
