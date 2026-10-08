import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900 dark:text-slate-50">
          {title}
        </h1>
        {description ? (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        ) : null}
      </div>
      {actions}
    </div>
  );
}

export function Metric({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="gm-metric rounded-2xl border border-brand-100 bg-gradient-to-br from-white to-brand-50 p-5 shadow-sm dark:border-slate-800 dark:from-slate-950 dark:to-slate-900">
      {icon ? (
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-2xl bg-brand-600 text-white shadow-sm [&>svg]:h-5 [&>svg]:w-5">
          {icon}
        </div>
      ) : null}
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-[28px] font-bold leading-none tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint ? <div className="mt-3 text-xs leading-5 text-slate-500">{hint}</div> : null}
    </div>
  );
}

export function Pagination({
  page,
  pageSize,
  total,
  onPage,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-sm text-slate-500 dark:text-slate-400">
      <p>
        Page {page} of {pages}
        {total >= 0 ? ` · ${total} records` : ''}
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
