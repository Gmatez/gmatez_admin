'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatBps, formatDuration, formatMoney } from '@/lib/money';
import type { CallDetail } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';

export default function CallDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useQueryClient();
  const [open, setOpen] = useState(false);
  const call = useQuery({
    queryKey: ['call', id],
    queryFn: () => apiGet<CallDetail>(`/admin/calls/${id}`),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status && ['INITIATED', 'RINGING', 'ACCEPTED', 'CONNECTING', 'CONNECTED'].includes(status)
        ? 10_000
        : false;
    },
  });
  const refund = useMutation({
    mutationFn: (reason: string) =>
      apiSend(`/admin/calls/${id}/refund`, 'POST', { reason }),
    onSuccess: () => {
      toast.success('Refund request accepted');
      setOpen(false);
      void client.invalidateQueries({ queryKey: ['call', id] });
      void client.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (call.isLoading) return <PageSkeleton />;
  if (call.error) return <ErrorState error={call.error} onRetry={() => call.refetch()} />;
  const record = call.data;
  if (!record) return null;
  const canRefund = record.settlementStatus === 'SETTLED' && record.billedAmountCents > 0 && !record.refunded;
  return (
    <div className="space-y-6">
      <PageHeader
        title="Call investigation"
        description={record.id}
        actions={
          canRefund ? (
            <Button variant="danger" onClick={() => setOpen(true)}>
              Refund {formatMoney(record.billedAmountCents)}
            </Button>
          ) : null
        }
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge value={record.status} />
        <StatusBadge value={record.settlementStatus} />
        {record.refunded ? <StatusBadge value="REFUNDED" /> : null}
        <StatusBadge value={record.callType} />
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold">Caller</h2>
          <p className="text-sm">{record.caller.profile?.displayName}</p>
          <p className="text-sm">{record.caller.phone ?? 'No phone'}</p>
          <Link className="text-sm font-medium text-blue-600 underline" href={`/users/${record.callerId}`}>Open user</Link>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold">Host</h2>
          <p className="text-sm">{record.callee.profile?.displayName}</p>
          <p className="text-sm">{record.callee.phone ?? 'No phone'}</p>
          <Link className="text-sm font-medium text-blue-600 underline" href={`/hosts/${record.calleeId}`}>Open host</Link>
        </article>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="font-semibold">Billing</h2>
        <p>Rate {formatMoney(record.ratePerMinuteCents)} / min</p>
        <p>Hold {formatMoney(record.heldAmountCents)}</p>
        <p>Billed {formatMoney(record.billedAmountCents)} · {formatDuration(record.billedSeconds)}</p>
        <p>Host share {formatMoney(record.creatorEarningCents)} at {formatBps(record.creatorShareBps)}</p>
        <p>Platform share {formatMoney(record.platformFeeCents)}</p>
        <p>Settlement applied {formatWhen(record.settlementAppliedAt)}</p>
        <p>End reason {record.endReason ?? '—'}</p>
        {record.refund ? <p>Refund {formatMoney(record.refund.amountCents)} at {formatWhen(record.refund.createdAt)}</p> : null}
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="font-semibold">RTC</h2>
        <p>Provider {record.rtc.provider}</p>
        <p>Channel {record.rtc.channelName}</p>
        <p>Session {record.providerSessionId}</p>
        <p>Caller heartbeat {formatWhen(record.callerHeartbeatAt)}</p>
        <p>Host heartbeat {formatWhen(record.calleeHeartbeatAt)}</p>
        <p className="text-slate-500">RTC tokens and provider certificates are not available in this view.</p>
      </section>
      <section>
        <h2 className="mb-2 font-semibold">Timeline</h2>
        <ol className="space-y-2 border-l-2 border-blue-200 pl-4 text-sm dark:border-blue-900">
          <li>{formatWhen(record.createdAt)} · Record created · {record.status === 'INITIATED' ? 'INITIATED' : 'created'}</li>
          {record.events.map((event) => (
            <li key={event.id}>
              {formatWhen(event.createdAt)} · {event.fromStatus ?? '—'} → {event.toStatus} · {event.source}
              {event.note ? ` · ${event.note}` : ''}
            </li>
          ))}
          {record.connectedAt ? <li>{formatWhen(record.connectedAt)} · Connected timestamp</li> : null}
          {record.endedAt ? <li>{formatWhen(record.endedAt)} · Ended timestamp</li> : null}
          {record.settlementAppliedAt ? <li>{formatWhen(record.settlementAppliedAt)} · Settlement applied</li> : null}
        </ol>
      </section>
      <p className="text-sm text-slate-500">There is no admin force-end endpoint. Active calls are observed here and refreshed every 10 seconds.</p>
      <ConfirmDialog
        open={open}
        title="Refund this call"
        description={`You are about to refund ${formatMoney(record.billedAmountCents)} to this user. This action affects the financial ledger. The host earning is reversed using the configured share. Continue?`}
        confirmLabel="Refund full amount"
        destructive
        requireReason
        pending={refund.isPending}
        onOpenChange={setOpen}
        onConfirm={(reason) => refund.mutate(reason)}
      />
    </div>
  );
}
