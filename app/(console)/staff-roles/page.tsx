'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { apiGet, apiSend } from '@/lib/api/client';
import { errorText } from '@/lib/errors';
import { formatWhen } from '@/lib/format';
import { PERMISSIONS, type Permission, type StaffRole } from '@/types/admin';
import { ConfirmDialog } from '@/components/dialogs/confirm-dialog';
import { PageHeader } from '@/components/shared/page';
import { EmptyState, ErrorState, PageSkeleton } from '@/components/shared/states';
import { Button } from '@/components/ui/button';
import { Input, Label } from '@/components/ui/fields';

const card =
  'rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950';

const PERMISSION_LABEL: Record<Permission, string> = {
  'staff.manage': 'Manage staff roles',
  'hosts.manage': 'Manage hosts (approve, reject, supervise)',
  'payouts.manage': 'Manage payouts',
  'payments.view': 'View payments',
  'reports.manage': 'Manage reports',
  'banners.manage': 'Manage banners',
  'users.manage': 'Manage users',
  'pricing.manage': 'Manage call pricing',
  'calls.view': 'View calls',
  'audit.view': 'View audit logs',
};

function PermissionGrid({
  selected,
  onChange,
}: {
  selected: Permission[];
  onChange: (next: Permission[]) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {PERMISSIONS.map((permission) => (
        <label key={permission} className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={selected.includes(permission)}
            onChange={(event) => {
              onChange(
                event.target.checked
                  ? [...selected, permission]
                  : selected.filter((item) => item !== permission),
              );
            }}
          />
          {PERMISSION_LABEL[permission]}
        </label>
      ))}
    </div>
  );
}

function CreateRoleCard() {
  const client = useQueryClient();
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const create = useMutation({
    mutationFn: () => apiSend('/admin/staff-roles', 'POST', { name, permissions }),
    onSuccess: () => {
      toast.success('Role created');
      setName('');
      setPermissions([]);
      void client.invalidateQueries({ queryKey: ['staff-roles'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <section className={card}>
      <h2 className="font-semibold">New role</h2>
      <p className="mt-1 text-sm text-slate-500">
        A role with no permissions checked effectively grants view-only admin login until you add some.
      </p>
      <div className="mt-4 space-y-3">
        <div>
          <Label htmlFor="role-name">Name</Label>
          <Input
            id="role-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Coordinator"
          />
        </div>
        <PermissionGrid selected={permissions} onChange={setPermissions} />
      </div>
      <Button
        className="mt-4"
        onClick={() => create.mutate()}
        disabled={create.isPending || name.trim().length < 2}
      >
        {create.isPending ? 'Creating…' : 'Create role'}
      </Button>
    </section>
  );
}

function RoleCard({ role }: { role: StaffRole }) {
  const client = useQueryClient();
  const [permissions, setPermissions] = useState<Permission[]>(role.permissions);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const dirty = JSON.stringify([...permissions].sort()) !== JSON.stringify([...role.permissions].sort());
  const save = useMutation({
    mutationFn: () => apiSend(`/admin/staff-roles/${role.id}`, 'PATCH', { permissions }),
    onSuccess: () => {
      toast.success('Role updated');
      void client.invalidateQueries({ queryKey: ['staff-roles'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const remove = useMutation({
    mutationFn: () => apiSend(`/admin/staff-roles/${role.id}`, 'DELETE'),
    onSuccess: () => {
      toast.success('Role deleted');
      setConfirmDelete(false);
      void client.invalidateQueries({ queryKey: ['staff-roles'] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <section className={card}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">{role.name}</h2>
          <p className="text-xs text-slate-500">
            {role._count?.members ?? 0} member{role._count?.members === 1 ? '' : 's'} · updated {formatWhen(role.updatedAt)}
          </p>
        </div>
        <Button variant="danger" size="sm" onClick={() => setConfirmDelete(true)}>
          Delete
        </Button>
      </div>
      <div className="mt-4">
        <PermissionGrid selected={permissions} onChange={setPermissions} />
      </div>
      <Button className="mt-4" onClick={() => save.mutate()} disabled={save.isPending || !dirty}>
        {save.isPending ? 'Saving…' : 'Save permissions'}
      </Button>
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${role.name}`}
        description="Members of this role fall back to unrestricted admin access, not locked out."
        confirmLabel="Delete role"
        destructive
        pending={remove.isPending}
        onOpenChange={(open) => { if (!open) setConfirmDelete(false); }}
        onConfirm={() => remove.mutate()}
      />
    </section>
  );
}

export default function StaffRolesPage() {
  const query = useQuery({
    queryKey: ['staff-roles'],
    queryFn: () => apiGet<StaffRole[]>('/admin/staff-roles'),
  });
  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff roles"
        description="Dynamically creatable internal roles. An admin with no role assigned stays fully unrestricted — a role only narrows access once it's assigned to them from their user page."
      />
      <CreateRoleCard />
      {query.isLoading ? <PageSkeleton /> : null}
      {query.error ? <ErrorState error={query.error} onRetry={() => query.refetch()} /> : null}
      {query.data?.length === 0 ? (
        <EmptyState title="No roles yet" body="Create one above to start scoping admin access." />
      ) : null}
      <div className="space-y-4">
        {query.data?.map((role) => <RoleCard key={role.id} role={role} />)}
      </div>
    </div>
  );
}
