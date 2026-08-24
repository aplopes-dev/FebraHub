'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';

type SortableColumn = {
  getIsSorted: () => false | 'asc' | 'desc';
  toggleSorting: (desc?: boolean) => void;
};

type PatientsSortableHeaderProps = {
  label: string;
  column: SortableColumn;
};

export function PatientsSortableHeader({ label, column }: PatientsSortableHeaderProps) {
  const sorted = column.getIsSorted();

  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-start gap-2 font-medium text-foreground"
      onClick={() => column.toggleSorting(sorted === 'asc')}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      {sorted === 'asc' ? (
        <ArrowUp className="size-4" aria-hidden />
      ) : sorted === 'desc' ? (
        <ArrowDown className="size-4" aria-hidden />
      ) : (
        <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}
