'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableStyleProps } from '@/features/shared/lib/data-table-styles';
import { getPatientCategoryColorHex } from '@/features/clinic/modules/patients/lib/patient-category-colors';
import type { PatientCategory } from '@/features/clinic/modules/patients/types/patient-category';

type ClinicPatientCategoriesTableProps = {
  categories: PatientCategory[];
  onEdit?: (category: PatientCategory) => void;
  onDelete?: (category: PatientCategory) => void;
};

export function ClinicPatientCategoriesTable({
  categories,
  onEdit,
  onDelete,
}: ClinicPatientCategoriesTableProps) {
  const columns = useMemo<ColumnDef<PatientCategory>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-2 font-medium text-foreground"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Nome
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="size-4" aria-hidden />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="size-4" aria-hidden />
            ) : (
              <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <span
              className="size-3 shrink-0 rounded-full"
              style={{ backgroundColor: getPatientCategoryColorHex(row.original.colorId) }}
              aria-hidden
            />
            <span className="font-medium text-foreground">{row.original.name}</span>
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            {onEdit ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Editar ${row.original.name}`}
                onClick={() => onEdit(row.original)}
              >
                <Pencil className="size-4" aria-hidden />
              </Button>
            ) : null}
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Excluir ${row.original.name}`}
                disabled={row.original.isProtected}
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="size-4 text-destructive" aria-hidden />
              </Button>
            ) : null}
          </div>
        ),
      },
    ],
    [onDelete, onEdit],
  );

  return (
    <DataTable
      columns={columns}
      data={categories}
      pageSize={20}
      entityName="categorias"
      emptyMessage="Nenhuma categoria cadastrada."
      emptyPaginationLabel="Nenhuma categoria"
      paginationClassName={categories.length <= 20 ? 'hidden' : undefined}
      {...erpDataTableStyleProps}
    />
  );
}
