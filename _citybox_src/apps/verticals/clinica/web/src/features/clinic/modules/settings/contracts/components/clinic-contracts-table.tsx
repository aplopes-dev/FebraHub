'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { Badge, Button } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { erpDataTableStyleProps } from '@/features/shared/lib/data-table-styles';
import type { ClinicContractTemplate } from '../types/clinic-contract';

type ClinicContractsTableProps = {
  templates: ClinicContractTemplate[];
  onEdit?: (template: ClinicContractTemplate) => void;
  onDelete?: (template: ClinicContractTemplate) => void;
  isDeleting?: boolean;
};

export function ClinicContractsTable({
  templates,
  onEdit,
  onDelete,
  isDeleting = false,
}: ClinicContractsTableProps) {
  const columns = useMemo<ColumnDef<ClinicContractTemplate>[]>(
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-foreground">{row.original.name}</span>
            {row.original.isDefault ? (
              <Badge
                variant="outline"
                className="border-primary/30 bg-primary/5 text-[10px] font-medium text-primary"
              >
                Padrão
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Editar ${row.original.name}`}
              onClick={() => onEdit?.(row.original)}
            >
              <Pencil className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Excluir ${row.original.name}`}
              disabled={isDeleting}
              onClick={() => void onDelete?.(row.original)}
            >
              <Trash2 className="size-4 text-destructive" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [isDeleting, onDelete, onEdit],
  );

  return (
    <DataTable
      columns={columns}
      data={templates}
      pageSize={20}
      entityName="modelos"
      emptyMessage="Nenhum modelo de contrato cadastrado."
      emptyPaginationLabel="Nenhum modelo"
      paginationClassName={templates.length <= 20 ? 'hidden' : undefined}
      {...erpDataTableStyleProps}
    />
  );
}
