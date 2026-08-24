'use client';

import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type {
  PatientFinancialSort,
  PatientFinancialSortColumn,
} from '../../../lib/sort-patient-financial-entries';

type PatientFinancialSortableHeaderProps = {
  label: string;
  column: PatientFinancialSortColumn;
  sort: PatientFinancialSort | null;
  onSort: (column: PatientFinancialSortColumn) => void;
};

export function PatientFinancialSortableHeader({
  label,
  column,
  sort,
  onSort,
}: PatientFinancialSortableHeaderProps) {
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
