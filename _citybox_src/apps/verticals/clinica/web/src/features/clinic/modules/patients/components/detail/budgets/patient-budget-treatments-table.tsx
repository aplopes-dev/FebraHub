'use client';

import { useMemo } from 'react';
import { cn } from '@citybox/ui';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { formatBrlCurrencyFromCents } from '@/features/clinic/modules/settings/plans/lib/format-brl-currency';
import { useStore } from '@/lib/store-context';
import {
  storeLocationColumnLabel,
  storeProfessionalLabel,
} from '@/lib/clinic-strand';
import { formatBudgetTreatmentListName } from '../../../lib/expand-budget-treatments-by-sessions';
import { formatPatientBudgetTreatmentLocation } from '../../../lib/patient-budget-tooth-numbers';
import type { PatientBudgetTreatmentItem } from '../../../types/patient-budget-form';
import {
  PATIENT_DATA_TABLE_CLASS,
  PATIENT_DATA_TABLE_HEADER_CLASS,
  PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../../../lib/patient-detail-tabs-ui';
import {
  PatientBudgetTreatmentActionsMenu,
  type PatientBudgetTreatmentAction,
} from './patient-budget-treatment-actions-menu';

function TruncatedCell({ value, className }: { value: string; className?: string }) {
  if (!value) {
    return <span className={cn('text-sm text-muted-foreground', className)}>—</span>;
  }

  return (
    <span className={cn('block truncate text-sm text-foreground', className)} title={value}>
      {value}
    </span>
  );
}

function budgetTreatmentsTableLabels(clinicStrand: string | null | undefined): {
  location: string;
  professional: string;
} {
  return {
    location: storeLocationColumnLabel(clinicStrand),
    professional: storeProfessionalLabel(clinicStrand),
  };
}

const MODAL_LIST_GRID_CLASS =
  'grid grid-cols-[4.5rem_minmax(0,1fr)_22%_20%_8rem] gap-0 px-3';

type PatientBudgetTreatmentsTableTotals = {
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
};

type PatientBudgetTreatmentsTableProps = {
  treatments: PatientBudgetTreatmentItem[];
  readOnly?: boolean;
  embedded?: boolean;
  /** Resumo financeiro sob a coluna Valor (modal lista de procedimentos). */
  totals?: PatientBudgetTreatmentsTableTotals;
  onTreatmentAction?: (
    treatment: PatientBudgetTreatmentItem,
    action: PatientBudgetTreatmentAction,
  ) => void;
};

export function PatientBudgetTreatmentsTable({
  treatments,
  readOnly = false,
  embedded = false,
  totals,
  onTreatmentAction,
}: PatientBudgetTreatmentsTableProps) {
  const { clinicStrand } = useStore();
  const labels = budgetTreatmentsTableLabels(clinicStrand);
  const isModalList = readOnly && embedded;

  const columns = useMemo<ColumnDef<PatientBudgetTreatmentItem>[]>(() => {
    const headerLabel = (label: string, alignRight = false) => (
      <span
        className={cn(
          'block w-full text-sm font-medium text-foreground',
          alignRight ? 'text-right' : 'text-left',
        )}
      >
        {label}
      </span>
    );

    const baseColumns: ColumnDef<PatientBudgetTreatmentItem>[] = [
      {
        id: 'tooth',
        accessorKey: 'toothNumber',
        header: () => headerLabel(labels.location),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="block text-left text-sm font-medium text-foreground">
            {formatPatientBudgetTreatmentLocation(row.original)}
          </span>
        ),
      },
      {
        id: 'treatment',
        accessorKey: 'treatmentName',
        header: () => headerLabel('Procedimento'),
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell
            value={formatBudgetTreatmentListName(row.original)}
            className="text-left"
          />
        ),
      },
      {
        id: 'professional',
        accessorKey: 'professionalName',
        header: () => headerLabel(labels.professional),
        enableSorting: false,
        cell: ({ row }) => (
          <TruncatedCell value={row.original.professionalName} className="text-left" />
        ),
      },
      {
        id: 'plan',
        accessorKey: 'planName',
        header: () => headerLabel('Plano'),
        enableSorting: false,
        cell: ({ row }) => <TruncatedCell value={row.original.planName} className="text-left" />,
      },
      {
        id: 'value',
        accessorKey: 'valueCents',
        header: () => headerLabel('Valor', readOnly),
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className={cn(
              'block text-sm font-medium tabular-nums text-foreground',
              readOnly && 'text-right',
            )}
          >
            {formatBrlCurrencyFromCents(row.original.valueCents)}
          </span>
        ),
      },
    ];

    if (readOnly || !onTreatmentAction) {
      return baseColumns;
    }

    return [
      ...baseColumns,
      {
        id: 'actions',
        header: () => (
          <span className="block w-full text-right font-medium text-foreground">Ações</span>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <PatientBudgetTreatmentActionsMenu
              treatment={row.original}
              onAction={(action) => onTreatmentAction(row.original, action)}
            />
          </div>
        ),
      },
    ];
  }, [labels.location, labels.professional, onTreatmentAction, readOnly]);

  if (isModalList) {
    return (
      <div className="min-w-0 overflow-hidden rounded-lg border border-border/60">
        <div
          className={cn(
            MODAL_LIST_GRID_CLASS,
            'border-b border-border/60 bg-muted py-3 text-sm font-medium text-foreground',
          )}
          role="row"
        >
          <span className="text-left">{labels.location}</span>
          <span className="text-left">Procedimento</span>
          <span className="text-left">{labels.professional}</span>
          <span className="text-left">Plano</span>
          <span className="text-right">Valor</span>
        </div>

        {treatments.length === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-muted-foreground">
            Nenhum procedimento adicionado ao orçamento.
          </p>
        ) : (
          <ul className="divide-y divide-border/60">
            {treatments.map((treatment) => (
              <li
                key={treatment.id}
                className={cn(MODAL_LIST_GRID_CLASS, 'py-2.5 text-sm')}
              >
                <span className="font-medium text-foreground">
                  {formatPatientBudgetTreatmentLocation(treatment)}
                </span>
                <TruncatedCell
                  value={formatBudgetTreatmentListName(treatment)}
                  className="text-left"
                />
                <TruncatedCell value={treatment.professionalName} className="text-left" />
                <TruncatedCell value={treatment.planName} className="text-left" />
                <span className="text-right font-medium tabular-nums text-foreground">
                  {formatBrlCurrencyFromCents(treatment.valueCents)}
                </span>
              </li>
            ))}
          </ul>
        )}

        {totals ? (
          <div
            className={cn(
              MODAL_LIST_GRID_CLASS,
              'border-t border-border/60 bg-background py-3 text-sm',
            )}
          >
            <div className="col-span-4" aria-hidden />
            <div className="space-y-2.5 text-right">
              <div className="space-y-0.5">
                <p className="font-medium text-muted-foreground">Subtotal</p>
                <p className="font-semibold tabular-nums text-foreground">
                  {formatBrlCurrencyFromCents(totals.subtotalCents)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-medium text-muted-foreground">Desconto</p>
                <p className="font-semibold tabular-nums text-foreground">
                  {formatBrlCurrencyFromCents(totals.discountCents)}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-medium text-muted-foreground">Total</p>
                <p className="font-semibold tabular-nums text-foreground">
                  {formatBrlCurrencyFromCents(totals.totalCents)}
                </p>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  const table = (
    <DataTable
      columns={columns}
      data={treatments}
      pageSize={50}
      entityName="procedimento"
      emptyMessage="Nenhum procedimento adicionado ao orçamento."
      emptyPaginationLabel="Nenhum procedimento"
      enableSorting={false}
      paginationClassName="hidden"
      tableWrapperClassName={readOnly ? 'overflow-x-auto' : undefined}
      tableClassName={cn(
        PATIENT_DATA_TABLE_CLASS,
        readOnly && 'table-fixed w-full',
      )}
      headerClassName={
        readOnly
          ? PATIENT_DATA_TABLE_HEADER_CLASS
          : PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS
      }
      colgroup={
        readOnly ? (
          <colgroup>
            <col className="w-16" />
            <col />
            <col className="w-[22%]" />
            <col className="w-[18%]" />
            <col className="w-28" />
          </colgroup>
        ) : undefined
      }
    />
  );

  if (embedded) {
    return <div className="min-h-0 min-w-0 flex-1 overflow-hidden">{table}</div>;
  }

  return (
    <div
      className={cn(
        PATIENT_TABLE_CARD_CLASS,
        readOnly && 'min-w-0 overflow-hidden',
      )}
    >
      {table}
    </div>
  );
}
