export function PersonCell({ name }: { name: string }) {
  const parts = name.split(/\s+/).filter(Boolean).slice(0, 2);
  const initials = parts.map((part) => part[0]?.toUpperCase() ?? '').join('') || '?';
  return (
    <span className="inline-flex min-w-0 items-center gap-2.5">
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-200"
        aria-hidden
      >
        {initials}
      </span>
      <span className="truncate">{name}</span>
    </span>
  );
}
