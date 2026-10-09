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

const FIELD_LABEL: Record<string, string> = {
  displayName: 'Display name',
  bio: 'Bio',
  languages: 'Speaking languages',
  avatar: 'Profile photo',
  callTypes: 'Voice or video calls',
  pricing: 'Call prices',
  agreements: 'Agreements',
};

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

const card =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950';

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
  const percent = record.completeness?.percentage ?? 0;
  const name = record.user.profile?.displayName ?? 'Host';
  return (
    <div className="space-y-6">
      <PageHeader
        title={name}
        description="Review the profile, documents, and application before you approve or reject."
      />

      <section className={`${card} flex flex-col gap-5 lg:flex-row lg:items-center`}>
        <img
          src={record.user.profile?.avatarUrl || `/api/proxy/admin/hosts/${id}/avatar`}
          alt=""
          className="h-20 w-20 rounded-2xl object-cover ring-4 ring-slate-100 dark:ring-slate-800"
          onError={(event) => {
            event.currentTarget.src = '';
            event.currentTarget.classList.add('bg-slate-100');
          }}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-lg font-semibold">{name}</p>
          <p className="mt-1 text-sm text-slate-500">
            {record.user.phone ?? 'No phone'} · {record.user.email}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <StatusBadge value={record.status} />
            <StatusBadge value={record.availability} />
            <StatusBadge value={record.verificationStatus} />
            <span className="text-sm text-slate-500">
              {record.status === 'ACTIVE' ? 'Approved host' : 'Still a caller until approved'}
            </span>
          </div>
        </div>
        <div className="w-full lg:w-56">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-medium">Profile complete</span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {record.completeness?.isComplete
              ? 'Nothing is blocking approval.'
              : missing.map((field) => FIELD_LABEL[field] ?? field).join(', ')}
          </p>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <div className="space-y-6">
          <HostDocuments id={id} record={record} />
          <section className={card}>
            <h2 className="font-semibold">Application</h2>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <Fact label="Bio" value={record.applicationBio || record.user.profile?.bio || 'Not added'} />
              <Fact label="Speaking languages" value={record.languages.join(', ') || 'Not added'} />
              <Fact label="Interests" value={record.interests.join(', ') || 'Not added'} />
              <Fact
                label="Calls"
                value={`${record.voiceEnabled ? 'Voice on' : 'Voice off'} · ${record.videoEnabled ? 'Video on' : 'Video off'}`}
              />
              <Fact label="Voice price" value={`${formatMoney(record.voiceRatePerMinuteCents, 'INR')} / min`} />
              <Fact label="Video price" value={`${formatMoney(record.videoRatePerMinuteCents, 'INR')} / min`} />
              <Fact label="Account" value={record.user.status} />
              <Fact label="Submitted" value={formatWhen(record.submittedAt)} />
            </dl>
          </section>
          <section className={card}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-semibold">Agreements</h2>
              <Button variant="secondary" onClick={() => agreementsMutation.mutate()} disabled={agreementsMutation.isPending}>
                {agreementsMutation.isPending ? 'Saving…' : 'Record required agreements'}
              </Button>
            </div>
            {record.agreementAcceptances.length === 0 ? (
              <p className="mt-3 text-sm text-slate-500">No agreements recorded yet.</p>
            ) : (
              <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
                {record.agreementAcceptances.map((item) => (
                  <li key={`${item.agreementType}-${item.version}`} className="flex justify-between gap-3 py-2">
                    <span>{item.agreementType.replaceAll('_', ' ')} {item.version}</span>
                    <span className="text-slate-500">{formatWhen(item.acceptedAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <HostEditor id={id} record={record} />
        </div>

        <aside className={`${card} xl:sticky xl:top-4`}>
          <h2 className="font-semibold">Review</h2>
          <p className="mt-1 text-sm text-slate-500">
            The applicant sees the note you send with a status change. The internal note stays in admin.
          </p>
          <p className="mt-3 text-sm">Applicant note: {record.reviewNote ?? 'None'}</p>
          <p className="text-sm">Internal note: {record.internalNote ?? 'None'}</p>
          <p className="text-sm text-slate-500">Last reviewed {formatWhen(record.reviewedAt)}</p>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="host-note">Note the applicant can see</Label>
              <Textarea id="host-note" value={note} onChange={(event) => setNote(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="internal-note">Internal note</Label>
              <Textarea id="internal-note" value={internalNote} onChange={(event) => setInternalNote(event.target.value)} />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Application</p>
            {transitions.length === 0 ? <p className="text-sm text-slate-500">No status change is allowed.</p> : null}
            {transitions.map((status) => (
              <Button
                key={status}
                className="w-full"
                variant={status === 'REJECTED' || status === 'SUSPENDED' ? 'danger' : 'primary'}
                onClick={() => setNextStatus(status)}
              >
                {hostActionLabel(status)}
              </Button>
            ))}
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Documents</p>
            {VERIFICATION.filter((value) => value !== record.verificationStatus).map((value) => (
              <Button key={value} className="w-full" variant="secondary" onClick={() => setVerification(value)}>
                {verificationAction(value)}
              </Button>
            ))}
          </div>
        </aside>
      </div>

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
        description="This only records your manual document decision."
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

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  );
}

function HostDocuments({ id, record }: { id: string; record: HostRecord }) {
  const client = useQueryClient();
  const [proofType, setProofType] = useState(record.idProofType ?? 'AADHAAR');
  const [last4, setLast4] = useState(record.idProofLast4 ?? '');
  const [pending, setPending] = useState<'avatar' | 'proof' | null>(null);

  async function upload(kind: 'avatar' | 'id-proof', file: File) {
    const dataBase64 = await readBase64(file);
    setPending(kind === 'avatar' ? 'avatar' : 'proof');
    try {
      await apiSend(`/admin/hosts/${id}/${kind}`, 'POST', {
        mime: file.type || 'image/jpeg',
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
    <section className={card}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">Documents</h2>
          <p className="mt-1 text-sm text-slate-500">
            {record.idProofType ?? 'No document type'}{' '}
            {record.identityCardNumber
              ? `· ${record.identityCardNumber}`
              : record.idProofLast4
                ? `· ending ${record.idProofLast4}`
                : ''}
          </p>
        </div>
        <StatusBadge value={record.verificationStatus} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <DocumentPreview id={id} kind="identity-front" label="Card front" ready={Boolean(record.identityFrontMime)} />
        <DocumentPreview id={id} kind="identity-back" label="Card back" ready={Boolean(record.identityBackMime)} />
        <DocumentPreview id={id} kind="profile-image" label="Profile photo" ready={Boolean(record.profileImageMime)} />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="proof-type">Document type</Label>
          <Input id="proof-type" value={proofType} onChange={(event) => setProofType(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="proof-last4">Last 4 digits</Label>
          <Input id="proof-last4" value={last4} onChange={(event) => setLast4(event.target.value)} maxLength={4} />
        </div>
        <div>
          <Label htmlFor="proof-file">Replace ID proof</Label>
          <Input id="proof-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending !== null} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload('id-proof', file);
          }} />
        </div>
        <div>
          <Label htmlFor="avatar-file">Replace profile photo</Label>
          <Input id="avatar-file" type="file" accept="image/jpeg,image/png,image/webp" disabled={pending !== null} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload('avatar', file);
          }} />
        </div>
      </div>
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
  const src = `/api/proxy/admin/hosts/${id}/documents/${kind}`;
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900">
      {ready ? (
        <a href={src} target="_blank" rel="noreferrer">
          <img src={src} alt={label} className="h-44 w-full object-cover" />
        </a>
      ) : (
        <div className="flex h-44 items-center justify-center text-sm text-slate-400">Not uploaded</div>
      )}
      <figcaption className="px-3 py-2 text-sm font-medium">{label}</figcaption>
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
    <section className={card}>
      <h2 className="font-semibold">Correct this application</h2>
      <p className="mt-1 text-sm text-slate-500">Use this when the host typed something wrong. Documents stay on file.</p>
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
          <Label htmlFor="host-languages">Languages, separated by commas</Label>
          <Input id="host-languages" value={languages} onChange={(event) => setLanguages(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-interests">Interests, separated by commas</Label>
          <Input id="host-interests" value={interests} onChange={(event) => setInterests(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="host-identity">Identity number</Label>
          <Input id="host-identity" value={identity} onChange={(event) => setIdentity(event.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="voice-rate">Voice price (paise)</Label>
            <Input id="voice-rate" value={voiceRate} onChange={(event) => setVoiceRate(event.target.value)} />
          </div>
          <div>
            <Label htmlFor="video-rate">Video price (paise)</Label>
            <Input id="video-rate" value={videoRate} onChange={(event) => setVideoRate(event.target.value)} />
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={voice} onChange={(event) => setVoice(event.target.checked)} />
          Offer voice calls
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={video} onChange={(event) => setVideo(event.target.checked)} />
          Offer video calls
        </label>
      </div>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? 'Saving…' : 'Save corrections'}
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
