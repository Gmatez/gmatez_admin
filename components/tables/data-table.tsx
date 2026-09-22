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
    <div className="overflow-x-auto rounded-lg border border-stone-200 dark:border-stone-800">
      <table className="min-w-full border-collapse text-sm">
        <thead className="bg-stone-50 text-left text-xs uppercase tracking-wide text-stone-500 dark:bg-stone-900">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`px-3 py-2 font-medium ${column.align === 'right' ? 'text-right' : 'text-left'}`}
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
              className={`border-t border-stone-200 dark:border-stone-800 ${onRow ? 'cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900' : ''}`}
              onClick={onRow ? () => onRow(row) : undefined}
            >
              {columns.map((column) => (
                <td
                  key={column.key}
                  className={`px-3 py-2 align-middle text-stone-800 dark:text-stone-200 ${column.align === 'right' ? 'text-right tabular-nums' : ''}`}
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
