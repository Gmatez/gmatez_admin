'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { use, useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import type { AuditRow, ReportRow } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { Button } from '@/components/ui/button';

type Person = {
  id: string;
  email: string;
  phone: string | null;
  status: string;
  profile: { displayName: string } | null;
};

type ReportDetail = ReportRow & {
  reporter: Person;
  reported: Person;
  audit: AuditRow[];
};

const STATUSES = ['UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'OPEN'] as const;

export default function ReportDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const client = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const report = useQuery({
    queryKey: ['report', id],
    queryFn: () => apiGet<ReportDetail>(`/admin/reports/${id}`),
  });
  const mutation = useMutation({
    mutationFn: (input: { status: string; reason: string }) =>
      apiSend(`/admin/reports/${id}`, 'PATCH', input),
    onSuccess: () => {
      toast.success('Report updated');
      setStatus(null);
      void client.invalidateQueries({ queryKey: ['report', id] });
      void client.invalidateQueries({ queryKey: ['reports'] });
      void client.invalidateQueries({ queryKey: ['audit'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (report.isLoading) return <PageSkeleton />;
  if (report.error) return <ErrorState error={report.error} onRetry={() => report.refetch()} />;
  const record = report.data;
  if (!record) return null;
  return (
    <div className="space-y-4">
      <PageHeader title="Report" description={record.id} />
      <StatusBadge value={record.status} />
      <p className="text-sm">Reason {record.reason}</p>
      <p className="text-sm">Details {record.details || '—'}</p>
      <p className="text-sm">Related {record.referenceType ?? '—'} {record.referenceId ?? ''}</p>
      {record.referenceType === 'call' && record.referenceId ? (
        <Link className="text-sm text-teal-800 underline" href={`/calls/${record.referenceId}`}>Open call</Link>
      ) : null}
      <p className="text-sm">Reporter <Link className="text-teal-800 underline" href={`/users/${record.reporterId}`}>{record.reporter.profile?.displayName}</Link> · {record.reporter.status}</p>
      <p className="text-sm">Reported <Link className="text-teal-800 underline" href={`/users/${record.reportedId}`}>{record.reported.profile?.displayName}</Link> · {record.reported.status}</p>
      <p className="text-sm">Filed {formatWhen(record.createdAt)}</p>
      <div className="flex flex-wrap gap-2">
        {STATUSES.filter((value) => value !== record.status).map((value) => (
          <Button key={value} variant={value === 'DISMISSED' ? 'secondary' : 'primary'} onClick={() => setStatus(value)}>
            Mark {value.replaceAll('_', ' ').toLowerCase()}
          </Button>
        ))}
        <Link href={`/users/${record.reportedId}`}><Button variant="danger">Review reported account</Button></Link>
      </div>
      <section>
        <h2 className="font-semibold">Previous actions</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {record.audit.length === 0 ? <li>No audit rows yet.</li> : record.audit.map((row) => <li key={row.id}>{formatWhen(row.createdAt)} · {row.action}</li>)}
        </ul>
      </section>
      <ConfirmDialog
        open={status !== null}
        title="Update report"
        description="This changes the moderation status and writes an audit record. It does not suspend the user by itself."
        confirmLabel="Save"
        requireReason={status === 'RESOLVED' || status === 'DISMISSED'}
        pending={mutation.isPending}
        onOpenChange={(open) => { if (!open) setStatus(null); }}
        onConfirm={(reason) => { if (status) mutation.mutate({ status, reason }); }}
      />
    </div>
  );
}
