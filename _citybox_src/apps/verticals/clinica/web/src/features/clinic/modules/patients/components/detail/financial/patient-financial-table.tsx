'use client';

import { useCallback, useMemo, useState } from 'react';
import { CircleCheck } from 'lucide-react';
import { cn } from '@citybox/ui';
import { Badge, Checkbox } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import {
  isAllEvolutionsSelected,
  isSomeEvolutionsSelected,
  selectAllEvolutionIds,
  toggleEvolutionSelection,
} from '../../../lib/patient-evolution-selection';
import {
  getPatientFinancialPaymentMethodBadgeClass,
  getPatientFinancialPaymentMethodLabel,
} from '../../../lib/patient-financial-receive-payment-methods';
import {
  getNextPatientFinancialSort,
  type PatientFinancialSort,
} from '../../../lib/sort-patient-financial-entries';
import { isPatientFinancialEntryOverdue } from '../../../lib/is-patient-financial-entry-overdue';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';
import type { PatientFinancialEntryListMeta } from '../../../types/patient-financial-entry-api';
import {
  PatientFinancialActionsMenu,
  type PatientFinancialAction,
} from './patient-financial-actions-menu';
import {
  PatientFinancialPaginationBar,
  type PatientFinancialPageSize,
} from './patient-financial-pagination-bar';
import { PatientFinancialSortableHeader } from './patient-financial-sortable-header';

const OVERDUE_ROW_CLASS = 'bg-destructive/10';
const OVERDUE_TEXT_CLASS = 'text-destructive';
const RECEIVED_VALUE_CLASS = 'text-emerald-600 dark:text-emerald-400';
const RECEIVED_ICON_CLASS = 'size-5 text-emerald-600 dark:text-emerald-400';
const RECEIVE_ACTION_CLASS =
  'inline-flex h-8 min-w-[5.5rem] shrink-0 items-center justify-center rounded-md bg-transparent px-3 text-xs font-semibold text-blue-600 shadow-none transition-[background-color,box-shadow,color] hover:bg-blue-600/10 hover:text-blue-700 hover:shadow-sm dark:text-blue-400 dark:hover:bg-blue-500/15 dark:hover:text-blue-300';

type PatientFinancialTableProps = {
  entries: PatientFinancialEntry[];
  meta: PatientFinancialEntryListMeta;
  page: number;
  pageSize: PatientFinancialPageSize;
  sort: PatientFinancialSort | null;
  isLoading?: boolean;
  emptyMessage: string;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PatientFinancialPageSize) => void;
  onSortChange: (sort: PatientFinancialSort) => void;
  onReceive: (entry: PatientFinancialEntry) => void;
  onEntryAction: (entry: PatientFinancialEntry, action: PatientFinancialAction) => void;
};

function formatFinancialDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

function getFinancialValueClassName(entry: PatientFinancialEntry): string {
  if (entry.status === 'received') {
    return RECEIVED_VALUE_CLASS;
  }

  if (isPatientFinancialEntryOverdue(entry)) {
    return OVERDUE_TEXT_CLASS;
  }

  return 'text-foreground';
}

export function PatientFinancialTable({
  entries,
  meta,
  page,
  pageSize,
  sort,
  isLoading = false,
  emptyMessage,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onReceive,
  onEntryAction,
}: PatientFinancialTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const entryIds = useMemo(() => entries.map((entry) => entry.id), [entries]);
  const totalPages = Math.max(1, meta.totalPages || 1);

  const allSelected = isAllEvolutionsSelected(entryIds, selectedIds);
  const someSelected = isSomeEvolutionsSelected(entryIds, selectedIds);
  const selectAllState = allSelected ? true : someSelected ? 'indeterminate' : false;

  const handleToggleAll = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        setSelectedIds(selectAllEvolutionIds(entryIds));
        return;
      }

      setSelectedIds([]);
    },
    [entryIds],
  );

  const handleToggleOne = useCallback((entryId: string) => {
    setSelectedIds((current) => toggleEvolutionSelection(current, entryId));
  }, []);

  const handleDateSort = useCallback(() => {
    onSortChange(getNextPatientFinancialSort(sort, 'date'));
    onPageChange(1);
  }, [onPageChange, onSortChange, sort]);

  const columns = useMemo<ColumnDef<PatientFinancialEntry>[]>(
    () => [
      {
        id: 'date',
        accessorKey: 'date',
        header: () => (
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectAllState}
              onCheckedChange={handleToggleAll}
              aria-label="Selecionar todos os lançamentos"
            />
            <PatientFinancialSortableHeader
              label="Data"
              column="date"
              sort={sort}
              onSort={handleDateSort}
            />
          </div>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const checkboxId = `patient-financial-select-${row.original.id}`;

          return (
            <div className="flex items-center gap-3">
              <Checkbox
                id={checkboxId}
                checked={selectedIds.includes(row.original.id)}
                onCheckedChange={() => handleToggleOne(row.original.id)}
                aria-label={`Selecionar lançamento de ${formatFinancialDate(row.original.date)}`}
              />
              <label htmlFor={checkboxId} className="cursor-pointer text-sm text-foreground">
                {formatFinancialDate(row.original.date)}
              </label>
            </div>
          );
        },
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: () => <span className="font-medium text-foreground">Nome</span>,
        enableSorting: false,
        cell: ({ row }) => {
          const isOverdue = isPatientFinancialEntryOverdue(row.original);

          return (
            <span className={cn('text-sm', isOverdue ? OVERDUE_TEXT_CLASS : 'text-foreground')}>
              {row.original.name}
            </span>
          );
        },
      },
      {
        id: 'value',
        accessorKey: 'valueCents',
        header: () => (
          <span className="block w-full pr-1 text-right font-medium text-foreground">Valor</span>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const paymentMethodLabel = getPatientFinancialPaymentMethodLabel(
            row.original.paymentMethod,
          );
          const paymentMethodBadgeClass = getPatientFinancialPaymentMethodBadgeClass(
            row.original.paymentMethod,
          );

          return (
            <div className="flex w-full items-center justify-end gap-2 pr-1">
              {paymentMethodLabel && paymentMethodBadgeClass ? (
                <Badge
                  variant="outline"
                  className={cn('shrink-0 font-normal', paymentMethodBadgeClass)}
                >
                  {paymentMethodLabel}
                </Badge>
              ) : null}
              <span
                className={cn(
                  'text-sm font-medium tabular-nums',
                  getFinancialValueClassName(row.original),
                )}
              >
                {formatBrlCurrencyFromCents(row.original.valueCents)}
              </span>
            </div>
          );
        },
      },
      {
        id: 'receive',
        header: () => <span className="sr-only">Receber</span>,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.status === 'pending' ? (
            <button
              type="button"
              className={RECEIVE_ACTION_CLASS}
              onClick={() => onReceive(row.original)}
            >
              Receber
            </button>
          ) : (
            <div className="flex h-8 min-w-[5.5rem] items-center justify-center">
              <CircleCheck className={RECEIVED_ICON_CLASS} aria-label="Recebido" />
            </div>
          ),
      },
      {
        id: 'actions',
        header: () => <span className="sr-only">Ações</span>,
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <PatientFinancialActionsMenu
              entry={row.original}
              onAction={(action) => onEntryAction(row.original, action)}
            />
          </div>
        ),
      },
    ],
    [
      handleDateSort,
      handleToggleAll,
      handleToggleOne,
      onEntryAction,
      onReceive,
      selectedIds,
      selectAllState,
      sort,
    ],
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={entries}
        pageSize={pageSize}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={meta.total}
        entityName="lançamento"
        emptyMessage={isLoading ? 'Carregando lançamentos…' : emptyMessage}
        emptyPaginationLabel="Nenhum lançamento"
        enableSorting={false}
        paginationClassName="hidden"
        colgroup={
          <colgroup>
            <col style={{ width: '11rem' }} />
            <col />
            <col style={{ width: '12.5rem' }} />
            <col style={{ width: '5.5rem' }} />
            <col style={{ width: '3rem' }} />
          </colgroup>
        }
        tableClassName="border-collapse [&_td]:border-0 [&_tr]:border-0 [&_tbody_tr]:border-0 [&_th:nth-child(3)]:pl-8 [&_td:nth-child(3)]:pl-8 [&_th:nth-child(4)]:pl-0 [&_td:nth-child(4)]:pl-0 [&_th:nth-child(4)]:pr-0 [&_td:nth-child(4)]:pr-0"
        headerClassName="bg-muted/40 [&_tr]:border-0 [&_th]:border-0 [&_th]:text-foreground"
        getRowClassName={(entry) =>
          isPatientFinancialEntryOverdue(entry) ? OVERDUE_ROW_CLASS : undefined
        }
      />

      <PatientFinancialPaginationBar
        page={page}
        pageSize={pageSize}
        total={meta.total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={(nextPageSize) => {
          onPageSizeChange(nextPageSize);
          onPageChange(1);
        }}
      />
    </>
  );
}
