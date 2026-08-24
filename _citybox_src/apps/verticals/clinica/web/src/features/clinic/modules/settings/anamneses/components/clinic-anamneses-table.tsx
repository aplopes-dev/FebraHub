'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  ERP_DATA_TABLE_BODY_CLASS,
  ERP_DATA_TABLE_HEADER_CLASS,
  ERP_DATA_TABLE_ROOT_CLASS,
} from '@/features/shared/lib/data-table-styles';
import { CLINIC_ANAMNESIS_STATUS_LABEL } from '../lib/clinic-anamnesis-ui';
import type { ClinicAnamnesisTemplate } from '../types/clinic-anamnesis';

type ClinicAnamnesesTableProps = {
  templates: ClinicAnamnesisTemplate[];
  onEdit?: (template: ClinicAnamnesisTemplate) => void;
  onDelete?: (template: ClinicAnamnesisTemplate) => void;
  onToggleStatus?: (template: ClinicAnamnesisTemplate, active: boolean) => void;
};

export function ClinicAnamnesesTable({
  templates,
  onEdit,
  onDelete,
  onToggleStatus,
}: ClinicAnamnesesTableProps) {
  const columns = useMemo<ColumnDef<ClinicAnamnesisTemplate>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            type="button"
            className="inline-flex items-center gap-2 whitespace-nowrap font-medium text-foreground"
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
          <span className="whitespace-nowrap font-medium text-foreground">
            {row.original.name}
          </span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const isActive = row.original.status === 'active';
          const statusInputId = `anamnesis-status-${row.original.id}`;

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <ClinicCompactSwitch
                id={statusInputId}
                checked={isActive}
                onCheckedChange={(checked) => onToggleStatus?.(row.original, checked === true)}
              />
              <Label htmlFor={statusInputId} className="text-sm font-normal text-muted-foreground">
                {CLINIC_ANAMNESIS_STATUS_LABEL[isActive ? 'active' : 'inactive']}
              </Label>
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: 'Ações',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1 whitespace-nowrap">
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
              onClick={() => onDelete?.(row.original)}
            >
              <Trash2 className="size-4 text-destructive" aria-hidden />
            </Button>
          </div>
        ),
      },
    ],
    [onDelete, onEdit, onToggleStatus],
  );

  return (
    <div className="min-w-0 max-w-full overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <DataTable
        columns={columns}
        data={templates}
        pageSize={20}
        entityName="modelos"
        emptyMessage="Nenhum modelo de anamnese cadastrado."
        emptyPaginationLabel="Nenhum modelo"
        paginationClassName={templates.length <= 20 ? 'hidden' : undefined}
        className={cn(
          ERP_DATA_TABLE_ROOT_CLASS,
          'min-w-0 max-w-full [&>div:first-child]:overflow-visible',
        )}
        tableWrapperClassName="overflow-visible"
        tableClassName={cn(
          ERP_DATA_TABLE_BODY_CLASS,
          'min-w-[36rem] table-auto [&_td]:max-w-none [&_td]:overflow-visible [&_th]:max-w-none [&_th]:overflow-visible',
        )}
        headerClassName={cn(
          ERP_DATA_TABLE_HEADER_CLASS,
          '[&_th]:max-w-none [&_th]:overflow-visible',
        )}
      />
    </div>
  );
}
