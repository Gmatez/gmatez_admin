'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api/client';
import { formatMoney } from '@/lib/money';
import type { Reconciliation } from '@/types/admin';
import { PageHeader } from '@/components/shared/page';
import { ErrorState } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';
import { StatusBadge } from '@/components/status/status-badge';

export default function ReconciliationPage() {
  const [userId, setUserId] = useState('');
  const [active, setActive] = useState('');
  const query = useQuery({
    queryKey: ['reconcile', active],
    queryFn: () => apiGet<Reconciliation>(`/admin/users/${active}/wallet/reconcile`),
    enabled: active.length > 0,
  });
  return (
    <div>
      <PageHeader
        title="Wallet reconciliation"
        description="Diagnostic only. This compares the wallet cache, ledger, and active call holds. It does not change balances."
      />
      <form
        className="filter-bar"
        onSubmit={(event) => {
          event.preventDefault();
          setActive(userId.trim());
        }}
      >
        <Label htmlFor="user-id">User id</Label>
        <Input id="user-id" value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="User id" />
        <Button type="submit" className="h-9">Check</Button>
      </form>
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data ? (
        <section className="space-y-2 rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <StatusBadge value={query.data.ok ? 'ok' : 'error'} />
          <p>Available {formatMoney(query.data.availableBalanceCents, query.data.currency)}</p>
          <p>Held {formatMoney(query.data.heldBalanceCents, query.data.currency)}</p>
          <p>Wallet total {formatMoney(query.data.walletTotalCents, query.data.currency)}</p>
          <p>Ledger net {formatMoney(query.data.ledgerNetCents, query.data.currency)}</p>
          <p>Ledger credits {formatMoney(query.data.ledgerCreditCents, query.data.currency)}</p>
          <p>Ledger debits {formatMoney(query.data.ledgerDebitCents, query.data.currency)}</p>
          <p>Active call holds {formatMoney(query.data.heldFromActiveCallsCents, query.data.currency)}</p>
          <p>Issues {query.data.issues.length ? query.data.issues.join(', ') : 'none'}</p>
        </section>
      ) : null}
    </div>
  );
}
