import type { ReactNode } from 'react';

export type Column<T> = {
  key: string;
  header: string;
  align?: 'left' | 'right';
  cell: (row: T) => ReactNode;
};

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRow,
}: {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRow?: (row: T) => void;
}) {
  return (
    <div className="gm-table overflow-x-auto rounded-2xl border border-brand-100 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-brand-50/80 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900">
          <tr>
            {columns.map((column, index) => (
              <th
                key={column.key}
                scope="col"
                className={`px-4 py-3 font-semibold ${column.align === 'right' ? 'text-right' : 'text-left'} ${index === 0 ? 'sticky left-0 z-10 bg-brand-50/80 dark:bg-slate-900' : ''}`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              className={`group border-t border-slate-100 dark:border-slate-800 ${onRow ? 'cursor-pointer hover:bg-brand-50 dark:hover:bg-slate-900' : 'hover:bg-brand-50/60 dark:hover:bg-slate-900'}`}
              onClick={onRow ? () => onRow(row) : undefined}
            >
              {columns.map((column, index) => (
                <td
                  key={column.key}
                  className={`px-4 py-3.5 align-middle text-slate-700 dark:text-slate-200 ${column.align === 'right' ? 'text-right tabular-nums' : ''} ${index === 0 ? 'sticky left-0 z-10 bg-white font-medium text-slate-900 group-hover:bg-brand-50 dark:bg-slate-950 dark:text-slate-50 dark:group-hover:bg-slate-900' : ''}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
