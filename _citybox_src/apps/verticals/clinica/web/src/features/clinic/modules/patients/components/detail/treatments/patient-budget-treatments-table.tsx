'use client';

import { useMemo } from 'react';
import { cn } from '@citybox/ui';
import { Button } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import { formatPatientTreatmentLabel } from '../../../lib/patient-treatment-ui';
import {
  PATIENT_DATA_TABLE_CLASS,
  PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../../../lib/patient-detail-tabs-ui';
import type { PatientTreatment } from '../../../types/patient-treatment';
import {
  PatientTreatmentActionsMenu,
  type PatientTreatmentAction,
} from './patient-treatment-actions-menu';

type PatientBudgetTreatmentsTableProps = {
  treatments: PatientTreatment[];
  disabled?: boolean;
  onFinalize: (treatmentId: string) => void;
  onTreatmentAction: (treatment: PatientTreatment, action: PatientTreatmentAction) => void;
};

export function PatientBudgetTreatmentsTable({
  treatments,
  disabled = false,
  onFinalize,
  onTreatmentAction,
}: PatientBudgetTreatmentsTableProps) {
  const columns = useMemo<ColumnDef<PatientTreatment>[]>(
    () => [
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Descrição',
        enableSorting: false,
        cell: ({ row }) => {
          const label = formatPatientTreatmentLabel(row.original);

          return (
            <span className="block truncate text-sm text-foreground" title={label}>
              {label}
            </span>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="block w-full text-right font-medium text-foreground">Ações</span>
        ),
        enableSorting: false,
        cell: ({ row }) => {
          const isFinalized = row.original.status === 'finalized';

          if (isFinalized) {
            return (
              <div className="flex justify-end">
                <span className="text-xs text-muted-foreground">Finalizado</span>
              </div>
            );
          }

          return (
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => onFinalize(row.original.id)}
              >
                Finalizar
              </Button>
              <PatientTreatmentActionsMenu
                treatment={row.original}
                disabled={disabled}
                onAction={(action) => onTreatmentAction(row.original, action)}
              />
            </div>
          );
        },
      },
    ],
    [disabled, onFinalize, onTreatmentAction],
  );

  return (
    <div className={cn(PATIENT_TABLE_CARD_CLASS)}>
      <DataTable
        columns={columns}
        data={treatments}
        pageSize={50}
        entityName="procedimento"
        emptyMessage="Nenhum procedimento encontrado."
        emptyPaginationLabel="Nenhum procedimento"
        enableSorting={false}
        paginationClassName="hidden"
        tableClassName={PATIENT_DATA_TABLE_CLASS}
        headerClassName={PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS}
      />
    </div>
  );
}
