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
import { Input, Label, Textarea } from '@/components/ui/fields';

const VERIFICATION = ['NOT_REQUIRED', 'PENDING', 'VERIFIED', 'REJECTED'] as const;

function verificationAction(value: string) {
  switch (value) {
    case 'VERIFIED':
      return 'Verify documents';
    case 'REJECTED':
      return 'Reject documents';
    case 'PENDING':
      return 'Mark documents pending';
    default:
      return 'Skip document review';
  }
}

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
  const agreementsMutation = useMutation({
    mutationFn: () => apiSend(`/admin/hosts/${id}/agreements`, 'POST'),
    onSuccess: () => {
      toast.success('Required agreements recorded');
      void client.invalidateQueries({ queryKey: ['host', id] });
    },
    onError: (error) => toast.error(errorText(error)),
  });

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
        <span className="text-sm text-slate-500">Operating as {record.status === 'ACTIVE' ? 'Host' : 'User'}</span>
      </div>
      <HostDocuments id={id} record={record} />
      <HostEditor id={id} record={record} />
      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold">Applicant</h2>
          <p className="mt-2 text-sm">Account {record.user.status}</p>
          <p className="text-sm">Bio: {record.applicationBio || record.user.profile?.bio || '—'}</p>
          <p className="text-sm">Languages: {record.languages.join(', ') || '—'}</p>
          <p className="text-sm">
            Voice {formatMoney(record.voiceRatePerMinuteCents)} / min · Video {formatMoney(record.videoRatePerMinuteCents)} / min
          </p>
          <p className="text-sm">Voice {record.voiceEnabled ? 'enabled' : 'off'} · Video {record.videoEnabled ? 'enabled' : 'off'}</p>
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
          <h2 className="font-semibold">Completeness {record.completeness?.percentage ?? 0}%</h2>
          <p className="mt-2 text-sm">{record.completeness?.isComplete ? 'Ready for approval.' : 'Missing fields block approval.'}</p>
          <ul className="mt-2 list-disc pl-5 text-sm">
            {missing.length === 0 ? <li>No missing fields</li> : missing.map((field) => <li key={field}>{field}</li>)}
          </ul>
        </article>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="font-semibold">Agreements</h2>
        {record.agreementAcceptances.length === 0 ? <p className="mt-2 text-sm">None accepted.</p> : null}
        <ul className="mt-2 space-y-1 text-sm">
          {record.agreementAcceptances.map((item) => (
            <li key={`${item.agreementType}-${item.version}`}>
              {item.agreementType} {item.version} · {formatWhen(item.acceptedAt)}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-slate-500">
          Required: {(record.completeness?.requiredAgreements ?? []).map((item) => `${item.agreementType} ${item.version}`).join(', ') || '—'}
        </p>
        <Button className="mt-3" variant="secondary" onClick={() => agreementsMutation.mutate()} disabled={agreementsMutation.isPending}>
          {agreementsMutation.isPending ? 'Saving…' : 'Record required agreements'}
        </Button>
      </section>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
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
              {verificationAction(value)}
            </Button>
          ))}
        </div>
        <p className="mt-3 text-xs text-slate-500">
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

function HostDocuments({ id, record }: { id: string; record: HostRecord }) {
  const client = useQueryClient();
  const [proofType, setProofType] = useState(record.idProofType ?? 'AADHAAR');
  const [last4, setLast4] = useState(record.idProofLast4 ?? '');
  const [pending, setPending] = useState<'avatar' | 'proof' | null>(null);
  const avatar = record.user.profile?.avatarUrl;

  async function upload(kind: 'avatar' | 'id-proof', file: File) {
    const dataBase64 = await readBase64(file);
    setPending(kind === 'avatar' ? 'avatar' : 'proof');
    try {
      await apiSend(`/admin/hosts/${id}/${kind}`, 'POST', {
        mime: file.type,
        dataBase64,
        ...(kind === 'id-proof' ? { idProofType: proofType, idProofLast4: last4 } : {}),
      });
      toast.success(kind === 'avatar' ? 'Profile image stored' : 'ID proof stored');
      void client.invalidateQueries({ queryKey: ['host', id] });
    } catch (error) {
      toast.error(errorText(error));
    } finally {
      setPending(null);
    }
  }

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="font-semibold">Profile</h2>
        <p className="mt-2 text-sm">{record.user.profile?.displayName ?? '—'} · {record.user.phone ?? 'No phone'} · {record.user.email}</p>
        <p className="text-sm">Gender {record.user.profile?.gender ?? '—'} · {record.user.profile?.country ?? 'No location'}</p>
        {avatar ? <img src={avatar} alt="" className="mt-3 h-16 w-16 rounded-full object-cover" /> : <p className="mt-3 text-sm text-slate-500">No public avatar URL.</p>}
        <img src={`/api/proxy/admin/hosts/${id}/avatar`} alt="" className="mt-3 h-16 w-16 rounded-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
        <Label htmlFor="avatar-file">Replace profile image</Label>
        <Input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending !== null} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload('avatar', file);
        }} />
      </article>
      <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
        <h2 className="font-semibold">Identity documents</h2>
        <p className="mt-2 text-sm">{record.idProofType ?? 'None'} {record.identityCardNumber ? `· ${record.identityCardNumber}` : record.idProofLast4 ? `· ending ${record.idProofLast4}` : ''}</p>
        <p className="text-sm">Manual review <StatusBadge value={record.verificationStatus} /> {record.idProofUpdatedAt ? `· updated ${formatWhen(record.idProofUpdatedAt)}` : ''}</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <DocumentPreview id={id} kind="identity-front" label="Front" ready={Boolean(record.identityFrontMime)} />
          <DocumentPreview id={id} kind="identity-back" label="Back" ready={Boolean(record.identityBackMime)} />
          <DocumentPreview id={id} kind="profile-image" label="Profile" ready={Boolean(record.profileImageMime)} />
        </div>
        <div className="mt-3 grid gap-2">
          <Label htmlFor="proof-type">ID proof type</Label>
          <Input id="proof-type" value={proofType} onChange={(event) => setProofType(event.target.value)} />
          <Label htmlFor="proof-last4">Last 4 digits</Label>
          <Input id="proof-last4" value={last4} onChange={(event) => setLast4(event.target.value)} maxLength={4} />
          <Label htmlFor="proof-file">Upload or replace ID proof</Label>
          <Input id="proof-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending !== null} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload('id-proof', file);
          }} />
        </div>
      </article>
    </section>
  );
}

function DocumentPreview({
  id,
  kind,
  label,
  ready,
}: {
  id: string;
  kind: string;
  label: string;
  ready: boolean;
}) {
  if (!ready) {
    return <p className="text-sm text-slate-500">{label}: not uploaded</p>;
  }
  return (
    <figure>
      <img
        src={`/api/proxy/admin/hosts/${id}/documents/${kind}`}
        alt={label}
        className="max-h-40 w-full rounded-lg border border-slate-200 object-contain"
      />
      <figcaption className="mt-1 text-xs text-slate-500">{label}</figcaption>
    </figure>
  );
}

function HostEditor({ id, record }: { id: string; record: HostRecord }) {
  const client = useQueryClient();
  const [displayName, setDisplayName] = useState(record.user.profile?.displayName ?? '');
  const [bio, setBio] = useState(record.applicationBio || record.user.profile?.bio || '');
  const [languages, setLanguages] = useState(record.languages.join(', '));
  const [interests, setInterests] = useState(record.interests.join(', '));
  const [voiceRate, setVoiceRate] = useState(String(record.voiceRatePerMinuteCents));
  const [videoRate, setVideoRate] = useState(String(record.videoRatePerMinuteCents));
  const [identity, setIdentity] = useState(record.identityCardNumber ?? '');
  const [proofType, setProofType] = useState(record.idProofType ?? 'AADHAAR');
  const [voice, setVoice] = useState(record.voiceEnabled);
  const [video, setVideo] = useState(record.videoEnabled);
  const save = useMutation({
    mutationFn: () =>
      apiSend(`/admin/hosts/${id}/details`, 'PATCH', {
        displayName,
        bio,
        languages: languages.split(',').map((item) => item.trim()).filter(Boolean),
        interests: interests.split(',').map((item) => item.trim()).filter(Boolean),
        voiceEnabled: voice,
        videoEnabled: video,
        voiceRatePerMinuteCents: Number(voiceRate),
        videoRatePerMinuteCents: Number(videoRate),
        ...(identity.trim() ? { identityCardNumber: identity.trim(), idProofType: proofType } : { idProofType: proofType }),
      }),
    onSuccess: () => {
      toast.success('Host details saved');
      void client.invalidateQueries({ queryKey: ['host', id] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <h2 className="font-semibold">Edit application</h2>
      <p className="mt-1 text-sm text-slate-500">Uploaded documents stay on file. Saving here corrects the profile an admin reviews. Verification stays manual.</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="host-name">Display name</Label>
          <Input id="host-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-proof-type">Document type</Label>
          <Input id="host-proof-type" value={proofType} onChange={(event) => setProofType(event.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="host-bio">Bio</Label>
          <Textarea id="host-bio" value={bio} onChange={(event) => setBio(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-languages">Languages (comma separated)</Label>
          <Input id="host-languages" value={languages} onChange={(event) => setLanguages(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-interests">Interests (comma separated)</Label>
          <Input id="host-interests" value={interests} onChange={(event) => setInterests(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-identity">Identity number</Label>
          <Input id="host-identity" value={identity} onChange={(event) => setIdentity(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="voice-rate">Voice rate (paise)</Label>
            <Input id="voice-rate" value={voiceRate} onChange={(event) => setVoiceRate(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="video-rate">Video rate (paise)</Label>
            <Input id="video-rate" value={videoRate} onChange={(event) => setVideoRate(event.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={voice} onChange={(event) => setVoice(event.target.checked)} />
          Voice calls
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={video} onChange={(event) => setVideo(event.target.checked)} />
          Video calls
        </label>
      </div>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save host details'}
      </Button>
    </section>
  );
}

function readBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const value = String(reader.result ?? '');
      resolve(value.slice(value.indexOf(',') + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
