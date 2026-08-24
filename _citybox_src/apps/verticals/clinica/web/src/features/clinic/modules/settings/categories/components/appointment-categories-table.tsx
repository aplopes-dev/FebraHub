'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableStyleProps } from '@/features/shared/lib/data-table-styles';
import { resolveAppointmentCategoryColor } from '@/features/clinic/agenda/lib/appointment-category-colors';
import type { AppointmentCategoryApi } from '@/features/clinic/agenda/api/types';

type AppointmentCategoriesTableProps = {
  categories: AppointmentCategoryApi[];
  onEdit?: (category: AppointmentCategoryApi) => void;
  onDelete?: (category: AppointmentCategoryApi) => void;
};

export function AppointmentCategoriesTable({
  categories,
  onEdit,
  onDelete,
}: AppointmentCategoriesTableProps) {
  const columns = useMemo<ColumnDef<AppointmentCategoryApi>[]>(
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
              style={{
                backgroundColor: resolveAppointmentCategoryColor(row.original.color),
              }}
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
      {...erpDataTableStyleProps}
      emptyMessage="Nenhuma categoria de agendamento cadastrada."
    />
  );
}
