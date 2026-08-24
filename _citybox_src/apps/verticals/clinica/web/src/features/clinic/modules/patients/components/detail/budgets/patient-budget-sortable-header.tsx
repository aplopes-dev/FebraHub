'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { PatientBudgetSort, PatientBudgetSortColumn } from '../../../lib/sort-patient-budgets';

type PatientBudgetSortableHeaderProps = {
  label: string;
  column: PatientBudgetSortColumn;
  sort: PatientBudgetSort | null;
  onSort: (column: PatientBudgetSortColumn) => void;
};

export function PatientBudgetSortableHeader({
  label,
  column,
  sort,
  onSort,
}: PatientBudgetSortableHeaderProps) {
  const isActive = sort?.column === column;
  const direction = isActive ? (sort.desc ? 'desc' : 'asc') : false;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 font-medium text-foreground"
      onClick={() => onSort(column)}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      {direction === 'asc' ? (
        <ArrowUp className="size-4" aria-hidden />
      ) : direction === 'desc' ? (
        <ArrowDown className="size-4" aria-hidden />
      ) : (
        <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}
