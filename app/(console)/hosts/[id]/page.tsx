'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { formatMoney } from '@/lib/money';
import { allowedHostTransitions, hostActionLabel, type HostStatus } from '@/lib/hosts/transitions';
import type { HostRecord } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';
import { Label, Textarea } from '@/components/ui/fields';

const VERIFICATION = ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;

export default function HostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useQueryClient();
  const host = useQuery({
    queryKey: ['host', id],
    queryFn: () => apiGet<HostRecord>(`/admin/hosts/${id}`),
  });
  const [nextStatus, setNextStatus] = useState<HostStatus | null>(null);
  const [note, setNote] = useState('');
  const [internalNote, setInternalNote] = useState('');
  const [verification, setVerification] = useState<string | null>(null);

  const statusMutation = useMutation({
    mutationFn: (input: { status: HostStatus; reason: string }) =>
      apiSend(`/admin/hosts/${id}/status`, 'PATCH', {
        status: input.status,
        reviewNote: input.reason,
        internalNote,
      }),
    onSuccess: () => {
      toast.success('Host status updated');
      setNextStatus(null);
      void client.invalidateQueries({ queryKey: ['host', id] });
      void client.invalidateQueries({ queryKey: ['hosts'] });
      void client.invalidateQueries({ queryKey: ['alerts'] });
      void client.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const verifyMutation = useMutation({
    mutationFn: (value: string) =>
      apiSend(`/admin/hosts/${id}/verification`, 'PATCH', {
        verificationStatus: value,
        internalNote,
      }),
    onSuccess: () => {
      toast.success('Verification updated');
      setVerification(null);
      void client.invalidateQueries({ queryKey: ['host', id] });
    },
    onError: (error) => toast.error(errorText(error)),
  });

  if (host.isLoading) return <PageSkeleton />;
  if (host.error) return <ErrorState error={host.error} onRetry={() => host.refetch()} />;
  const record = host.data;
  if (!record) return null;
  const transitions = allowedHostTransitions(record.status);
  const missing = record.completeness?.missingFields ?? [];
  return (
    <div className="space-y-6">
      <PageHeader
        title={record.user.profile?.displayName ?? 'Host'}
        description={`${record.user.phone ?? 'No phone'} · ${record.user.email}`}
      />
      <div className="flex flex-wrap gap-2">
        <StatusBadge value={record.status} />
        <StatusBadge value={record.availability} />
        <StatusBadge value={record.verificationStatus} />
      </div>
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
          <h2 className="font-semibold">Applicant</h2>
          <p className="mt-2 text-sm">Account {record.user.status}</p>
          <p className="text-sm">Bio: {record.applicationBio || record.user.profile?.bio || '—'}</p>
          <p className="text-sm">Languages: {record.languages.join(', ') || '—'}</p>
          <p className="text-sm">
            Voice {formatMoney(record.voiceRatePerMinuteCents)} / min · Video {formatMoney(record.videoRatePerMinuteCents)} / min
          </p>
          <p className="text-sm">Voice {record.voiceEnabled ? 'enabled' : 'off'} · Video {record.videoEnabled ? 'enabled' : 'off'}</p>
        </article>
        <article className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
          <h2 className="font-semibold">Completeness {record.completeness?.percentage ?? 0}%</h2>
          <p className="mt-2 text-sm">{record.completeness?.isComplete ? 'Ready for approval.' : 'Missing fields block approval.'}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {missing.length === 0 ? <li>No missing fields</li> : missing.map((field) => <li key={field}>{field}</li>)}
          </ul>
        </article>
      </section>
      <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <h2 className="font-semibold">Agreements</h2>
        {record.agreementAcceptances.length === 0 ? <p className="mt-2 text-sm">None accepted.</p> : null}
        <ul className="mt-2 space-y-1 text-sm">
          {record.agreementAcceptances.map((item) => (
            <li key={`${item.agreementType}-${item.version}`}>
              {item.agreementType} {item.version} · {formatWhen(item.acceptedAt)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-stone-500">
          Required: {(record.completeness?.requiredAgreements ?? []).map((item) => `${item.agreementType} ${item.version}`).join(', ') || '—'}
        </p>
      </section>
      <section className="rounded-lg border border-stone-200 p-4 dark:border-stone-800">
        <h2 className="font-semibold">Review notes</h2>
        <p className="mt-2 text-sm">Applicant-facing: {record.reviewNote ?? '—'}</p>
        <p className="text-sm">Internal: {record.internalNote ?? '—'}</p>
        <p className="text-sm">Reviewed {formatWhen(record.reviewedAt)}</p>
        <div className="mt-3 space-y-2">
          <Label htmlFor="host-note">Note for this action</Label>
          <Textarea id="host-note" value={note} onChange={(event) => setNote(event.target.value)} />
          <Label htmlFor="internal-note">Internal note</Label>
          <Textarea id="internal-note" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {transitions.map((status) => (
            <Button
              key={status}
              variant={status === 'REJECTED' || status === 'SUSPENDED' ? 'danger' : 'primary'}
              onClick={() => setNextStatus(status)}
            >
              {hostActionLabel(status)}
            </Button>
          ))}
          {VERIFICATION.filter((value) => value !== record.verificationStatus).map((value) => (
            <Button key={value} variant="secondary" onClick={() => setVerification(value)}>
              Mark {value.replaceAll('_', ' ').toLowerCase()}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-stone-500">
          Allowed from {record.status}: {transitions.join(', ') || 'none'}. The API rejects any other transition.
        </p>
      </section>
      <ConfirmDialog
        open={nextStatus !== null}
        title={nextStatus ? hostActionLabel(nextStatus) : 'Update host'}
        description={
          nextStatus === 'REJECTED' || nextStatus === 'SUSPENDED'
            ? 'The applicant can see the review note. Approval is blocked while the profile is incomplete.'
            : 'This writes the host status and an audit event. Approval fails if required fields are missing.'
        }
        confirmLabel="Confirm status change"
        destructive={nextStatus === 'REJECTED' || nextStatus === 'SUSPENDED'}
        requireReason={nextStatus === 'REJECTED' || nextStatus === 'SUSPENDED'}
        pending={statusMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setNextStatus(null);
        }}
        onConfirm={(reason) => {
          if (!nextStatus) return;
          statusMutation.mutate({ status: nextStatus, reason: reason || note });
        }}
      />
      <ConfirmDialog
        open={verification !== null}
        title="Update verification"
        description="Manual verification only. An external KYC provider is not connected."
        confirmLabel="Save verification"
        pending={verifyMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setVerification(null);
        }}
        onConfirm={() => {
          if (verification) verifyMutation.mutate(verification);
        }}
      />
    </div>
  );
}
