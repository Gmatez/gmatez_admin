'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { apiGet, apiSend, type PageResult } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { createIdempotencyKey } from '@/lib/utils';
import { useUrlFilters } from '@/hooks/use-url-filters';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader, Pagination } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { StatusBadge } from '@/components/status/status-badge';
import { DataTable } from '@/components/tables/data-table';
import { Button } from '@/components/ui/button';
import { Input, Label, Select, Textarea } from '@/components/ui/fields';

type Notice = {
  id: string;
  userId: string;
  type: string;
  title: string;
  body: string;
  status: string;
  createdAt: string;
  user: { id: string; profile: { displayName: string } | null };
};

type Device = {
  id: string;
  userId: string;
  platform: string;
  tokenMasked: string;
  updatedAt: string;
  registration: string;
  user: { profile: { displayName: string } | null };
};

const schema = z.object({
  audience: z.enum(['USER', 'ALL_USERS', 'ALL_HOSTS']),
  userId: z.string(),
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(500),
  deepLink: z.string().regex(/^\/(?!\/).*/, 'Use an in-app path such as /wallet').or(z.literal('')),
  type: z.string().regex(/^[a-z0-9_]{2,40}$/),
}).superRefine((value, ctx) => {
  if (value.audience === 'USER' && !z.string().uuid().safeParse(value.userId).success) {
    ctx.addIssue({ code: 'custom', message: 'Enter a user id', path: ['userId'] });
  }
});

type FormValues = z.infer<typeof schema>;

export default function NotificationsPage() {
  const client = useQueryClient();
  const { params, page, pageSize, setParams } = useUrlFilters();
  const [preview, setPreview] = useState<FormValues | null>(null);
  const [key, setKey] = useState(createIdempotencyKey);
  const notices = useQuery({
    queryKey: ['notifications', params.toString()],
    queryFn: () =>
      apiGet<PageResult<Notice>>('/admin/notifications', {
        page,
        pageSize,
        status: params.get('status'),
        type: params.get('type'),
        userId: params.get('userId'),
        from: params.get('from'),
        to: params.get('to'),
      }),
  });
  const devices = useQuery({
    queryKey: ['devices', params.get('userId')],
    queryFn: () => apiGet<PageResult<Device>>('/admin/devices', { page: 1, pageSize: 20, userId: params.get('userId') }),
  });
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { audience: 'USER', userId: '', title: '', body: '', deepLink: '', type: 'system' },
  });
  const send = useMutation({
    mutationFn: (values: FormValues) =>
      apiSend<{ delivery?: string }>('/admin/notifications', 'POST', {
        ...values,
        userId: values.audience === 'USER' ? values.userId : undefined,
        deepLink: values.deepLink || undefined,
        idempotencyKey: key,
      }),
    onSuccess: (result) => {
      if (result.delivery === 'CONFIG_REQUIRED') {
        toast.message('Saved in app. Push delivery is CONFIG_REQUIRED until Firebase credentials are set.');
      } else {
        toast.success('Notification queued');
      }
      setPreview(null);
      setKey(createIdempotencyKey());
      form.reset();
      void client.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <div className="space-y-8">
      <PageHeader title="Notifications" description="Delivery state is PENDING until the push worker reports SENT or FAILED. Tokens are masked." />
      <form className="grid max-w-xl gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950" onSubmit={form.handleSubmit((values) => setPreview(values))}>
        <h2 className="font-semibold">Send a notification</h2>
        <Label htmlFor="audience">Audience</Label>
        <Select id="audience" {...form.register('audience')}>
          <option value="USER">Specific user</option>
          <option value="ALL_USERS">All active users</option>
          <option value="ALL_HOSTS">All active hosts</option>
        </Select>
        <Label htmlFor="recipient">Recipient user id</Label>
        <Input id="recipient" {...form.register('userId')} />
        <Label htmlFor="title">Title</Label>
        <Input id="title" {...form.register('title')} />
        <Label htmlFor="body">Body</Label>
        <Textarea id="body" {...form.register('body')} />
        <Label htmlFor="link">Deep link</Label>
        <Input id="link" placeholder="/wallet" {...form.register('deepLink')} />
        <Button type="submit">Preview</Button>
      </form>
      <div className="filter-bar">
        <Select aria-label="Delivery status" value={params.get('status') ?? ''} onChange={(e) => setParams({ status: e.target.value || null }, true)}>
          <option value="">Any delivery</option>
          <option value="PENDING">Pending</option>
          <option value="SENT">Sent</option>
          <option value="FAILED">Failed</option>
        </Select>
        <Input aria-label="Type" placeholder="Type" defaultValue={params.get('type') ?? ''} onBlur={(e) => setParams({ type: e.target.value || null }, true)} />
        <Input aria-label="User id" placeholder="User id" defaultValue={params.get('userId') ?? ''} onBlur={(e) => setParams({ userId: e.target.value || null }, true)} />
      </div>
      {notices.isLoading ? <PageSkeleton /> : null}
      {notices.error ? <ErrorState error={notices.error} onRetry={() => notices.refetch()} /> : null}
      {notices.data?.items.length === 0 ? <EmptyState title="No notifications" body="No messages match these filters." /> : null}
      {notices.data && notices.data.items.length > 0 ? (
        <>
          <DataTable
            rows={notices.data.items}
            rowKey={(row) => row.id}
            columns={[
              { key: 'user', header: 'Recipient', cell: (row) => row.user.profile?.displayName ?? row.userId.slice(0, 8) },
              { key: 'type', header: 'Type', cell: (row) => row.type },
              { key: 'title', header: 'Title', cell: (row) => row.title },
              { key: 'status', header: 'Status', cell: (row) => <StatusBadge value={row.status} /> },
              { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
            ]}
          />
          <Pagination page={notices.data.page} pageSize={notices.data.pageSize} total={notices.data.total} onPage={(n) => setParams({ page: String(n) })} />
        </>
      ) : null}
      <section>
        <h2 className="mb-2 font-semibold">Devices</h2>
        <p className="mb-2 text-sm text-slate-500">Stored registrations only. There is no last-seen or revoke flag beyond the token row.</p>
        {devices.data && devices.data.items.length > 0 ? (
          <DataTable
            rows={devices.data.items}
            rowKey={(row) => row.id}
            columns={[
              { key: 'user', header: 'User', cell: (row) => row.user.profile?.displayName ?? row.userId.slice(0, 8) },
              { key: 'platform', header: 'Platform', cell: (row) => row.platform },
              { key: 'token', header: 'Token', cell: (row) => row.tokenMasked },
              { key: 'state', header: 'State', cell: (row) => <StatusBadge value={row.registration} /> },
              { key: 'updated', header: 'Updated', cell: (row) => formatWhen(row.updatedAt) },
            ]}
          />
        ) : <p className="text-sm text-slate-500">No devices on this page.</p>}
      </section>
      <ConfirmDialog
        open={preview !== null}
        title="Send notification"
        description={preview ? `${preview.title}\n\n${preview.body}` : ''}
        confirmLabel="Send"
        pending={send.isPending}
        onOpenChange={(open) => { if (!open) setPreview(null); }}
        onConfirm={() => { if (preview) send.mutate(preview); }}
      />
    </div>
  );
}
