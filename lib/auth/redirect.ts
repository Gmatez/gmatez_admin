/** Allows only same-app paths. Rejects protocol-relative and external URLs. */
export function safeNextPath(value: string | null | undefined): string {
  if (!value) {
    return '/dashboard';
  }
  if (!value.startsWith('/') || value.startsWith('//') || value.includes('\\')) {
    return '/dashboard';
  }
  if (value.includes('://') || value.includes('%5C') || value.includes('%2F%2F')) {
    return '/dashboard';
  }
  return value;
}
