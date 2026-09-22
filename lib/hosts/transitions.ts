export const HOST_STATUSES = [
  'PENDING_REVIEW',
  'ACTIVE',
  'SUSPENDED',
  'REJECTED',
] as const;

export type HostStatus = (typeof HOST_STATUSES)[number];

/**
 * Mirrors HostsService.adminTransition. The backend remains authoritative.
 */
export const HOST_TRANSITIONS: Record<HostStatus, readonly HostStatus[]> = {
  PENDING_REVIEW: ['ACTIVE', 'REJECTED'],
  ACTIVE: ['SUSPENDED'],
  SUSPENDED: ['ACTIVE'],
  REJECTED: ['PENDING_REVIEW'],
};

export function allowedHostTransitions(status: string): HostStatus[] {
  if (!isHostStatus(status)) {
    return [];
  }
  return [...HOST_TRANSITIONS[status]];
}

export function isHostStatus(value: string): value is HostStatus {
  return (HOST_STATUSES as readonly string[]).includes(value);
}

export function hostActionLabel(status: HostStatus): string {
  switch (status) {
    case 'ACTIVE':
      return 'Approve host';
    case 'REJECTED':
      return 'Reject application';
    case 'SUSPENDED':
      return 'Suspend host';
    case 'PENDING_REVIEW':
      return 'Return to review';
  }
}
