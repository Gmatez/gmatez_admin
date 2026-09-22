'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { createIdempotencyKey } from '@/lib/utils';
import type { AdminUser, Reconciliation } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';
import { majorToMinor } from '@/lib/money';

type UserDetail = AdminUser & {
  calls: Array<{ id: string; status: string; callType: string; billedAmountCents: number; createdAt: string }>;
  payments: Array<{ id: string; status: string; amountCents: number; currency: string; createdAt: string }>;
  reports: Array<{ id: string; status: string; reason: string; createdAt: string }>;
  payouts: Array<{ id: string; status: string; amountCents: number; createdAt: string }>;
  hostProfile: {
    status: string;
    availability: string;
    verificationStatus: string;
    reviewNote: string | null;
  } | null;
};

type LedgerPage = {
  items: Array<{
    id: string;
    type: string;
    reason: string;
    amountCents: number;
    balanceAfterCents: number;
    createdAt: string;
  }>;
  nextCursor: string | null;
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <UserDetailView id={id} />;
}

function UserDetailView({ id }: { id: string }) {
  const client = useQueryClient();
  const [action, setAction] = useState<'SUSPENDED' | 'ACTIVE' | 'DELETED' | null>(null);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [idempotencyKey, setIdempotencyKey] = useState(createIdempotencyKey);
  const user = useQuery({
    queryKey: ['user', id],
    queryFn: () => apiGet<UserDetail>(`/admin/users/${id}`),
  });
  const ledger = useQuery({
    queryKey: ['ledger', id],
    queryFn: () => apiGet<LedgerPage>(`/admin/users/${id}/ledger`, { limit: 25 }),
  });
  const blocks = useQuery({
    queryKey: ['blocks', id],
    queryFn: () =>
      apiGet<{
        initiated: Array<{ id: string; blocked: { id: string; profile: { displayName: string } | null } }>;
        received: Array<{ id: string; blocker: { id: string; profile: { displayName: string } | null } }>;
      }>(`/admin/users/${id}/blocks`),
  });
  const reconcile = useQuery({
    queryKey: ['reconcile', id],
    queryFn: () => apiGet<Reconciliation>(`/admin/users/${id}/wallet/reconcile`),
  });
  const statusMutation = useMutation({
    mutationFn: (input: { status: string; reason: string }) =>
      apiSend(`/admin/users/${id}/status`, 'PATCH', input),
    onSuccess: () => {
      toast.success('Account status updated');
      setAction(null);
      void client.invalidateQueries({ queryKey: ['user', id] });
      void client.invalidateQueries({ queryKey: ['users'] });
      void client.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const adjust = useMutation({
    mutationFn: () => {
      const amountCents = majorToMinor(amount);
      if (amountCents === null || amountCents === 0) {
        throw new Error('Enter a non-zero amount such as 10.00 or -5.50');
      }
      return apiSend(`/admin/wallet/adjustments`, 'POST', {
        userId: id,
        amountCents,
        reason,
        idempotencyKey,
      });
    },
    onSuccess: () => {
      toast.success('Wallet adjustment recorded');
      setAdjustOpen(false);
      setAmount('');
      setReason('');
      setIdempotencyKey(createIdempotencyKey());
      void client.invalidateQueries({ queryKey: ['user', id] });
      void client.invalidateQueries({ queryKey: ['ledger', id] });
      void client.invalidateQueries({ queryKey: ['reconcile', id] });
    },
    onError: (error) => toast.error(errorText(error)),
  });

  if (user.isLoading) return <PageSkeleton />;
  if (user.error) return <ErrorState error={user.error} onRetry={() => user.refetch()} />;
  const record = user.data;
  if (!record) return null;
  const currency = record.wallet?.currency ?? 'USD';
  return (
    <div className="space-y-6">
      <PageHeader
        title={record.profile?.displayName ?? record.email}
        description={`${record.phone ?? 'No phone'} · ${record.email}`}
        actions={
          <div className="flex gap-2">
            {record.status !== 'SUSPENDED' ? (
              <Button variant="danger" onClick={() => setAction('SUSPENDED')}>
                Suspend
              </Button>
            ) : (
              <Button onClick={() => setAction('ACTIVE')}>Restore</Button>
            )}
            {record.status !== 'DELETED' ? (
              <Button variant="secondary" onClick={() => setAction('DELETED')}>
                Delete account
              </Button>
            ) : null}
            <Button variant="secondary" onClick={() => setAdjustOpen(true)}>
              Adjust wallet
            </Button>
          </div>
        }
      />
      <section className="grid gap-3 md:grid-cols-3">
        <Info label="Status" value={<StatusBadge value={record.status} />} />
        <Info label="Created" value={formatWhen(record.createdAt)} />
        <Info label="Last active" value={formatWhen(record.profile?.lastActiveAt)} />
      </section>
      {record.hostProfile ? (
        <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
          <h2 className="font-semibold">Host profile</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <StatusBadge value={record.hostProfile.status} />
            <StatusBadge value={record.hostProfile.availability} />
            <StatusBadge value={record.hostProfile.verificationStatus} />
          </div>
          <Link className="mt-3 inline-block text-sm text-teal-800 underline" href={`/hosts/${id}`}>
            Open host review
          </Link>
        </section>
      ) : null}
      <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <h2 className="font-semibold">Wallet</h2>
        <p className="mt-2 text-sm">
          Available {record.wallet ? formatMoney(record.wallet.availableBalanceCents, currency) : '—'} · Held{' '}
          {record.wallet ? formatMoney(record.wallet.heldBalanceCents, currency) : '—'}
        </p>
        {reconcile.data ? (
          <p className="mt-1 text-sm">
            Reconciliation {reconcile.data.ok ? 'matches the ledger' : reconcile.data.issues.join(', ')}. Ledger net{' '}
            {formatMoney(reconcile.data.ledgerNetCents, reconcile.data.currency)}.
          </p>
        ) : null}
        {ledger.data ? (
          <div className="mt-3">
            <DataTable
              rows={ledger.data.items}
              rowKey={(row) => row.id}
              columns={[
                { key: 'when', header: 'When', cell: (row) => formatWhen(row.createdAt) },
                { key: 'type', header: 'Type', cell: (row) => row.type },
                { key: 'reason', header: 'Reason', cell: (row) => row.reason },
                {
                  key: 'amount',
                  header: 'Amount',
                  align: 'right',
                  cell: (row) => formatMoney(row.type === 'DEBIT' ? -row.amountCents : row.amountCents, currency),
                },
                {
                  key: 'after',
                  header: 'Balance after',
                  align: 'right',
                  cell: (row) => formatMoney(row.balanceAfterCents, currency),
                },
              ]}
            />
          </div>
        ) : null}
      </section>
      <RecordList title="Calls" rows={record.calls.map((call) => ({ id: call.id, href: `/calls/${call.id}`, label: `${call.callType} · ${call.status}` }))} />
      <RecordList title="Payments" rows={record.payments.map((payment) => ({ id: payment.id, href: `/payments/${payment.id}`, label: `${payment.status} · ${formatMoney(payment.amountCents, payment.currency)}` }))} />
      <RecordList title="Reports" rows={record.reports.map((report) => ({ id: report.id, href: `/reports/${report.id}`, label: `${report.reason} · ${report.status}` }))} />
      <section>
        <h2 className="mb-2 font-semibold">Blocks</h2>
        <p className="text-sm text-stone-600">
          Initiated {blocks.data?.initiated.length ?? 0}. Received {blocks.data?.received.length ?? 0}. Blocks are shown for review and are not edited here.
        </p>
      </section>
      <ConfirmDialog
        open={action !== null}
        title={action === 'ACTIVE' ? 'Restore account' : action === 'DELETED' ? 'Delete account' : 'Suspend account'}
        description="This changes the account status on the backend and writes an audit record."
        confirmLabel="Confirm"
        destructive={action !== 'ACTIVE'}
        requireReason
        pending={statusMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setAction(null);
        }}
        onConfirm={(note) => {
          if (action) statusMutation.mutate({ status: action, reason: note });
        }}
      />
      <ConfirmDialog
        open={adjustOpen}
        title="Adjust wallet"
        description={`Post a signed ledger adjustment in ${currency}. Positive credits the user. Negative debits available balance. This is not reversible except by another audited adjustment.`}
        confirmLabel="Post adjustment"
        destructive
        pending={adjust.isPending}
        onOpenChange={setAdjustOpen}
        onConfirm={() => {
          if (reason.trim().length < 3) {
            toast.error('Enter a reason of at least 3 characters in the amount form.');
            return;
          }
          adjust.mutate();
        }}
      />
      {adjustOpen ? (
        <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-stone-200 bg-white p-4 shadow dark:border-stone-700 dark:bg-stone-950">
          <Label htmlFor="adjust-amount">Amount in major units</Label>
          <Input id="adjust-amount" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="10.00" />
          <div className="mt-2">
            <Label htmlFor="adjust-reason">Reason</Label>
            <Input id="adjust-reason" value={reason} onChange={(event) => setReason(event.target.value)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="rounded-lg border border-stone-200 p-3 dark:border-stone-800">
      <p className="text-xs uppercase text-stone-500">{label}</p>
      <div className="mt-1 text-sm">{value}</div>
    </div>
  );
}

function RecordList({
  title,
  rows,
}: {
  title: string;
  rows: Array<{ id: string; href: string; label: string }>;
}) {
  return (
    <section>
      <h2 className="mb-2 font-semibold">{title}</h2>
      {rows.length === 0 ? <p className="text-sm text-stone-500">None recorded.</p> : null}
      <ul className="space-y-1 text-sm">
        {rows.slice(0, 20).map((row) => (
          <li key={row.id}>
            <Link className="text-teal-800 underline" href={row.href}>
              {row.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
