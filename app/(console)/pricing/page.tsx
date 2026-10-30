'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatMoney, majorToMinor } from '@/lib/money';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';

type Pricing = {
  userRatePerMinuteCents: number;
  hostEarningPerMinuteCents: number;
  hostShareBps: number;
  userVideoRatePerMinuteCents: number | null;
} | null;

export default function PricingPage() {
  const client = useQueryClient();
  const query = useQuery({
    queryKey: ['pricing'],
    queryFn: () => apiGet<Pricing>('/admin/pricing'),
  });
  const [userRate, setUserRate] = useState('');
  const [hostRate, setHostRate] = useState('');
  const [videoRate, setVideoRate] = useState('');
  const save = useMutation({
    mutationFn: () => {
      const userRatePerMinuteCents = majorToMinor(userRate);
      const hostEarningPerMinuteCents = majorToMinor(hostRate);
      if (userRatePerMinuteCents == null || hostEarningPerMinuteCents == null) {
        throw new Error('Enter both amounts, for example 7.00 and 4.00');
      }
      const userVideoRatePerMinuteCents = videoRate.trim() === '' ? undefined : majorToMinor(videoRate);
      if (videoRate.trim() !== '' && userVideoRatePerMinuteCents == null) {
        throw new Error('Video rate must be a valid amount, e.g. 10.00, or left blank');
      }
      return apiSend('/admin/pricing', 'PATCH', {
        userRatePerMinuteCents,
        hostEarningPerMinuteCents,
        ...(userVideoRatePerMinuteCents != null ? { userVideoRatePerMinuteCents } : {}),
      });
    },
    onSuccess: () => {
      toast.success('Pricing saved for new calls');
      setUserRate('');
      setHostRate('');
      setVideoRate('');
      void client.invalidateQueries({ queryKey: ['pricing'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (query.isLoading) return <PageSkeleton />;
  if (query.error) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  const current = query.data;
  const draftUser = majorToMinor(userRate);
  const draftHost = majorToMinor(hostRate);
  const platform = draftUser != null && draftHost != null ? draftUser - draftHost : null;
  return (
    <div className="space-y-4">
      <PageHeader
        title="Call pricing"
        description="Sets the per-minute user charge and host earning for new calls. Calls already started keep the rate stored on them."
      />
      {current ? (
        <div className="gm-metrics grid gap-4 sm:grid-cols-4">
          <RateCard label="User pays (voice)" value={formatMoney(current.userRatePerMinuteCents)} hint="per minute" />
          <RateCard
            label="User pays (video)"
            value={current.userVideoRatePerMinuteCents != null ? formatMoney(current.userVideoRatePerMinuteCents) : '—'}
            hint={current.userVideoRatePerMinuteCents != null ? 'per minute' : "falls back to each host's own video rate"}
          />
          <RateCard label="Host earns" value={formatMoney(current.hostEarningPerMinuteCents)} hint={`${current.hostShareBps} bps`} />
          <RateCard
            label="Platform keeps (voice)"
            value={formatMoney(current.userRatePerMinuteCents - current.hostEarningPerMinuteCents)}
            hint="per minute"
          />
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          No global rule yet. New calls still use each host&apos;s own rate and the configured share.
        </p>
      )}
      <section className="gm-panel p-5">
        <h2 className="font-semibold text-slate-900 dark:text-slate-50">Update the rule</h2>
        <p className="mt-1 text-sm text-slate-500">Applies to new calls only. Calls already started keep their saved rate.</p>
        <form
          className="mt-4 grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <div>
            <Label htmlFor="user-rate">User charge / min (voice)</Label>
            <Input id="user-rate" className="mt-1" value={userRate} onChange={(event) => setUserRate(event.target.value)} placeholder="7.00" />
          </div>
          <div>
            <Label htmlFor="host-rate">Host earning / min</Label>
            <Input id="host-rate" className="mt-1" value={hostRate} onChange={(event) => setHostRate(event.target.value)} placeholder="4.00" />
          </div>
          <div>
            <Label htmlFor="video-rate">User charge / min (video, optional)</Label>
            <Input
              id="video-rate"
              className="mt-1"
              value={videoRate}
              onChange={(event) => setVideoRate(event.target.value)}
              placeholder="Leave blank to use each host's video rate"
            />
          </div>
          <div className="rounded-xl bg-brand-50 px-3 py-2 dark:bg-slate-900">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Platform / min (voice)</p>
            <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-50">
              {platform != null && platform >= 0 ? formatMoney(platform) : '—'}
            </p>
          </div>
          <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving…' : 'Save for new calls'}</Button>
        </form>
      </section>
    </div>
  );
}

function RateCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <article className="gm-metric rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900 dark:text-slate-50">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </article>
  );
}
