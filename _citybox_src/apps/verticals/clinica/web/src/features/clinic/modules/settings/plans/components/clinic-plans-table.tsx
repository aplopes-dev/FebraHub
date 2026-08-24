'use client';

import { useMemo } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Button, Badge, Label } from '@citybox/ui/atoms';
import { ClinicCompactSwitch } from '@/features/clinic/components/clinic-compact-switch';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  ERP_DATA_TABLE_BODY_CLASS,
  ERP_DATA_TABLE_HEADER_CLASS,
  ERP_DATA_TABLE_ROOT_CLASS,
} from '@/features/shared/lib/data-table-styles';
import { CLINIC_PLAN_DEFAULT_BADGE_CLASS, CLINIC_PLAN_STATUS_LABEL } from '../lib/clinic-plan-ui';
import type { ClinicPlan } from '../types/clinic-plan';

type ClinicPlansTableProps = {
  plans: ClinicPlan[];
  onEdit?: (plan: ClinicPlan) => void;
  onDelete?: (plan: ClinicPlan) => void;
  onToggleStatus?: (plan: ClinicPlan, active: boolean) => void;
};

export function ClinicPlansTable({ plans, onEdit, onDelete, onToggleStatus }: ClinicPlansTableProps) {
  const columns = useMemo<ColumnDef<ClinicPlan>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'order',
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
          <div className="flex items-center gap-2 whitespace-nowrap">
            <span className="font-medium text-foreground">{row.original.name}</span>
            {row.original.isDefault ? (
              <Badge variant="outline" className={cn('shrink-0', CLINIC_PLAN_DEFAULT_BADGE_CLASS)}>
                Padrão
              </Badge>
            ) : null}
          </div>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => {
          const isActive = row.original.status === 'active';
          const statusInputId = `plan-status-${row.original.id}`;

          return (
            <div className="flex items-center gap-2 whitespace-nowrap">
              <ClinicCompactSwitch
                id={statusInputId}
                checked={isActive}
                onCheckedChange={(checked) => onToggleStatus?.(row.original, checked === true)}
              />
              <Label htmlFor={statusInputId} className="text-sm font-normal text-muted-foreground">
                {CLINIC_PLAN_STATUS_LABEL[isActive ? 'active' : 'inactive']}
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
        data={plans}
        pageSize={20}
        entityName="planos"
        emptyMessage="Nenhum plano cadastrado."
        emptyPaginationLabel="Nenhum plano"
        paginationClassName={plans.length <= 20 ? 'hidden' : undefined}
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
