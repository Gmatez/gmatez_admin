'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatMoney, majorToMinor } from '@/lib/money';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';

type Plan = {
  id: string;
  name: string;
  priceMinor: number;
  walletCreditMinor: number;
  bonusMinor: number;
  coins: number;
  bonusCoins: number;
  description: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
};

export default function RechargePlansPage() {
  const client = useQueryClient();
  const plans = useQuery({
    queryKey: ['recharge-plans'],
    queryFn: () => apiGet<Plan[]>('/admin/recharge-plans'),
  });
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [coins, setCoins] = useState('');
  const [bonusCoins, setBonusCoins] = useState('0');
  const [description, setDescription] = useState('');
  const [order, setOrder] = useState('0');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [removeId, setRemoveId] = useState<string | null>(null);

  function refresh() {
    void client.invalidateQueries({ queryKey: ['recharge-plans'] });
  }

  function payload() {
    const priceMinor = majorToMinor(price);
    const coinCount = Number(coins);
    const bonusCount = Number(bonusCoins || '0');
    if (!name.trim() || priceMinor == null || !Number.isInteger(coinCount) || coinCount < 1) {
      throw new Error('Name, price, and coins are required');
    }
    if (!Number.isInteger(bonusCount) || bonusCount < 0) {
      throw new Error('Bonus coins must be a whole number');
    }
    return {
      name,
      priceMinor,
      coins: coinCount,
      bonusCoins: bonusCount,
      description,
      displayOrder: Number(order) || 0,
    };
  }

  function clearForm() {
    setEditingId(null);
    setName('');
    setPrice('');
    setCoins('');
    setBonusCoins('0');
    setDescription('');
    setOrder('0');
  }

  function startEdit(plan: Plan) {
    setEditingId(plan.id);
    setName(plan.name);
    setPrice((plan.priceMinor / 100).toFixed(2));
    setCoins(String(plan.coins ?? 0));
    setBonusCoins(String(plan.bonusCoins ?? 0));
    setDescription(plan.description);
    setOrder(String(plan.displayOrder));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const save = useMutation({
    mutationFn: () => {
      const body = payload();
      return editingId
        ? apiSend(`/admin/recharge-plans/${editingId}`, 'PATCH', body)
        : apiSend('/admin/recharge-plans', 'POST', { ...body, isActive: true });
    },
    onSuccess: () => {
      toast.success(editingId ? 'Recharge plan updated' : 'Recharge plan created');
      clearForm();
      refresh();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const toggle = useMutation({
    mutationFn: (plan: Plan) => apiSend(`/admin/recharge-plans/${plan.id}`, 'PATCH', { isActive: !plan.isActive }),
    onSuccess: () => refresh(),
    onError: (error) => toast.error(errorText(error)),
  });
  const remove = useMutation({
    mutationFn: (id: string) => apiSend(`/admin/recharge-plans/${id}`, 'DELETE'),
    onSuccess: () => {
      setRemoveId(null);
      toast.success('Recharge plan deleted');
      refresh();
    },
    onError: (error) => toast.error(errorText(error)),
  });

  const rows = plans.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recharge plans"
        description="These cards are what members see when they add credits. Only active plans can be purchased."
      />
      <form
        className="gm-panel p-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
              {editingId ? 'Edit plan' : 'New plan'}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Price is what the member pays. Coins is the number shown on the app card.
            </p>
          </div>
          <span className="flex gap-2">
            {editingId ? (
              <Button type="button" variant="secondary" onClick={clearForm}>
                Cancel
              </Button>
            ) : null}
            <Button type="submit" disabled={save.isPending}>
              {save.isPending ? 'Saving…' : editingId ? 'Save changes' : 'Add plan'}
            </Button>
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <Field id="plan-name" label="Name" value={name} onChange={setName} className="lg:col-span-2" />
          <Field id="plan-price" label="Price" value={price} onChange={setPrice} placeholder="299.00" />
          <Field id="plan-coins" label="Coins" value={coins} onChange={setCoins} placeholder="299" />
          <Field id="plan-bonus" label="Bonus coins" value={bonusCoins} onChange={setBonusCoins} placeholder="0" />
          <Field id="plan-description" label="Description" value={description} onChange={setDescription} className="sm:col-span-2 lg:col-span-4" />
          <Field id="plan-order" label="Display order" value={order} onChange={setOrder} />
        </div>
      </form>

      {plans.isLoading ? <PageSkeleton /> : null}
      {plans.error ? <ErrorState error={plans.error} onRetry={() => plans.refetch()} /> : null}
      {plans.data?.length === 0 ? (
        <EmptyState title="No recharge plans" body="Create a plan and it will show up here as a card." />
      ) : null}
      {rows.length > 0 ? (
        <div className="gm-metrics grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              editing={editingId === plan.id}
              onEdit={() => startEdit(plan)}
              onToggle={() => toggle.mutate(plan)}
              onDelete={() => setRemoveId(plan.id)}
            />
          ))}
        </div>
      ) : null}
      <ConfirmDialog
        open={removeId !== null}
        title="Delete recharge plan"
        description="This removes the plan. Existing payments are not changed."
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onOpenChange={(open) => {
          if (!open) setRemoveId(null);
        }}
        onConfirm={() => {
          if (removeId) remove.mutate(removeId);
        }}
      />
    </div>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  placeholder,
  className,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        className="mt-1"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function PlanCard({
  plan,
  editing,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: Plan;
  editing: boolean;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <article
      className={`gm-metric flex flex-col rounded-2xl border bg-white p-5 shadow-sm dark:bg-slate-950 ${
        editing
          ? 'border-brand-600 ring-2 ring-brand-600/30'
          : plan.isActive
            ? 'border-brand-100 dark:border-slate-800'
            : 'border-slate-200 opacity-80 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">
            {plan.displayOrder === 0 ? 'Featured' : `Order ${plan.displayOrder}`}
          </p>
          <h3 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">{plan.name}</h3>
        </div>
        <StatusBadge value={plan.isActive ? 'ACTIVE' : 'DISABLED'} />
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
        {formatMoney(plan.priceMinor)}
      </p>
      <p className="text-sm text-slate-500">Member pays</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Stat label="Coins" value={String(plan.coins ?? 0)} />
        <Stat label="Bonus coins" value={String(plan.bonusCoins ?? 0)} />
      </div>
      <p className="mt-3 min-h-10 text-sm text-slate-600 dark:text-slate-300">
        {plan.description || 'No description'}
      </p>
      <p className="mt-2 text-xs text-slate-400">
        Updated {formatWhen(plan.updatedAt)} · Created {formatWhen(plan.createdAt)}
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={onEdit}>
          Edit
        </Button>
        <Button size="sm" variant="secondary" onClick={onToggle}>
          {plan.isActive ? 'Disable' : 'Enable'}
        </Button>
        <Button size="sm" variant="danger" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-brand-50 px-3 py-2 dark:bg-slate-900">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-slate-50">{value}</p>
    </div>
  );
}
