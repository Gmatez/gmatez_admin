'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import type { StaffMember, StaffRole } from '@/types/admin';
import { DataTable } from '@/components/tables/data-table';
import { StatusBadge } from '@/components/status/status-badge';
import { PageHeader } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input, Label, Select } from '@/components/ui/fields';

const card =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950';

function CreateStaffCard({ roles }: { roles: StaffRole[] }) {
  const client = useQueryClient();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [staffRoleId, setStaffRoleId] = useState('');
  const create = useMutation({
    mutationFn: () =>
      apiSend('/admin/staff', 'POST', {
        email,
        password,
        displayName,
        staffRoleId: staffRoleId || null,
      }),
    onSuccess: () => {
      toast.success('Staff account created');
      setEmail('');
      setPassword('');
      setDisplayName('');
      setStaffRoleId('');
      void client.invalidateQueries({ queryKey: ['staff'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const valid = email.includes('@') && password.length >= 10 && displayName.trim().length >= 2;
  return (
    <section className={card}>
      <h2 className="font-semibold">New staff account</h2>
      <p className="mt-1 text-sm text-slate-500">
        Creates a login with internal admin access. Leave the role unset for a fully unrestricted admin, or assign
        a role to scope what they can do.
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="staff-email">Email</Label>
          <Input id="staff-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="staff-name">Display name</Label>
          <Input id="staff-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
        </div>
        <div>
          <Label htmlFor="staff-password">Password</Label>
          <Input
            id="staff-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="At least 10 characters"
          />
        </div>
        <div>
          <Label htmlFor="staff-role">Role</Label>
          <Select id="staff-role" value={staffRoleId} onChange={(event) => setStaffRoleId(event.target.value)}>
            <option value="">Unrestricted admin</option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Button className="mt-4" onClick={() => create.mutate()} disabled={create.isPending || !valid}>
        {create.isPending ? 'Creating…' : 'Create staff account'}
      </Button>
    </section>
  );
}

export default function StaffPage() {
  const staff = useQuery({
    queryKey: ['staff'],
    queryFn: () => apiGet<StaffMember[]>('/admin/staff'),
  });
  const roles = useQuery({
    queryKey: ['staff-roles'],
    queryFn: () => apiGet<StaffRole[]>('/admin/staff-roles'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff"
        description="Internal admin accounts only — never a caller or a host. Assign or change a role from a staff member's profile."
      />
      <CreateStaffCard roles={roles.data ?? []} />
      {staff.isLoading ? <PageSkeleton /> : null}
      {staff.error ? <ErrorState error={staff.error} onRetry={() => staff.refetch()} /> : null}
      {staff.data?.length === 0 ? (
        <EmptyState title="No staff accounts yet" body="Create one above." />
      ) : null}
      {staff.data && staff.data.length > 0 ? (
        <DataTable
          rows={staff.data}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              cell: (row) => (
                <Link className="font-medium text-blue-600 underline" href={`/users/${row.id}`}>
                  {row.profile?.displayName || row.email}
                </Link>
              ),
            },
            { key: 'email', header: 'Email', cell: (row) => row.email },
            { key: 'status', header: 'Account', cell: (row) => <StatusBadge value={row.status} /> },
            { key: 'role', header: 'Role', cell: (row) => row.staffRole?.name ?? 'Unrestricted admin' },
            { key: 'created', header: 'Created', cell: (row) => formatWhen(row.createdAt) },
          ]}
        />
      ) : null}
    </div>
  );
}
