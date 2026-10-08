import type { InputHTMLAttributes } from 'react';
import { Input } from '@/components/ui/fields';

export function DateFilter({
  label,
  ...props
}: { label: string } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  return (
    <label className="filter-field">
      <span>{label}</span>
      <Input type="date" {...props} />
    </label>
  );
}
