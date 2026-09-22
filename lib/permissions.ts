/**
 * The backend currently has a single privileged role: ADMIN.
 * This map is the extension point for future roles. It does not invent them.
 */
export type AdminRole = 'ADMIN';

export type AdminAction =
  | 'dashboard.view'
  | 'users.manage'
  | 'hosts.review'
  | 'calls.view'
  | 'payments.view'
  | 'wallet.adjust'
  | 'refunds.create'
  | 'payouts.manage'
  | 'notifications.send'
  | 'reports.resolve'
  | 'audit.view'
  | 'system.view';

const ADMIN_ACTIONS: ReadonlySet<AdminAction> = new Set([
  'dashboard.view',
  'users.manage',
  'hosts.review',
  'calls.view',
  'payments.view',
  'wallet.adjust',
  'refunds.create',
  'payouts.manage',
  'notifications.send',
  'reports.resolve',
  'audit.view',
  'system.view',
]);

export function isAdminRole(role: string | null | undefined): role is AdminRole {
  return role === 'ADMIN';
}

export function can(role: string | null | undefined, action: AdminAction): boolean {
  if (!isAdminRole(role)) {
    return false;
  }
  return ADMIN_ACTIONS.has(action);
}
