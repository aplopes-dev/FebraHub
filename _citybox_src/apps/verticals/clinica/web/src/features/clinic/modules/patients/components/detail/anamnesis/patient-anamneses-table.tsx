'use client';

import { useCallback, useMemo, type ReactNode } from 'react';
import { cn } from '@citybox/ui';
import { Badge } from '@citybox/ui/atoms';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  formatPatientAnamnesisSignatureIssuedAt,
  PATIENT_ANAMNESIS_SIGNATURE_STATUS_BADGE_CLASS,
  PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL,
  PATIENT_ANAMNESIS_STATUS_BADGE_CLASS,
  PATIENT_ANAMNESIS_STATUS_LABEL,
} from '../../../lib/patient-anamnesis-ui';
import {
  getNextPatientAnamnesisSort,
  type PatientAnamnesisSort,
  type PatientAnamnesisSortColumn,
} from '../../../lib/sort-patient-anamneses';
import type { PatientAnamnesis } from '../../../types/patient-anamnesis';
import type { PatientAnamnesisListMeta } from '../../../types/patient-anamnesis-api';
import {
  PatientAnamnesisActionsMenu,
  type PatientAnamnesisAction,
} from './patient-anamnesis-actions-menu';
import { PatientAnamnesisSortableHeader } from './patient-anamnesis-sortable-header';
import {
  PATIENT_DATA_TABLE_CLASS,
  PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../../../lib/patient-detail-tabs-ui';
import {
  PatientAnamnesesPaginationBar,
  type PatientAnamnesisPageSize,
} from './patient-anamneses-pagination-bar';

type PatientAnamnesesTableProps = {
  anamneses: PatientAnamnesis[];
  meta: PatientAnamnesisListMeta;
  page: number;
  pageSize: PatientAnamnesisPageSize;
  sort: PatientAnamnesisSort | null;
  emptyMessage: string;
  header?: ReactNode;
  /** `requestedAt` da assinatura eletrônica por id da anamnese (status pending). */
  signatureRequestedAtById?: Readonly<Record<string, string>>;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PatientAnamnesisPageSize) => void;
  onSortChange: (sort: PatientAnamnesisSort) => void;
  onAnamnesisAction: (anamnesis: PatientAnamnesis, action: PatientAnamnesisAction) => void;
};

function formatAnamnesisDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR');
}

export function PatientAnamnesesTable({
  anamneses,
  meta,
  page,
  pageSize,
  sort,
  emptyMessage,
  header,
  signatureRequestedAtById = {},
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onAnamnesisAction,
}: PatientAnamnesesTableProps) {
  const totalPages = Math.max(1, meta.totalPages || 1);

  const handleSort = useCallback(
    (column: PatientAnamnesisSortColumn) => {
      onSortChange(getNextPatientAnamnesisSort(sort, column));
      onPageChange(1);
    },
    [onPageChange, onSortChange, sort],
  );

  const columns = useMemo<ColumnDef<PatientAnamnesis>[]>(
    () => [
      {
        id: 'issuedAt',
        accessorKey: 'issuedAt',
        header: () => (
          <PatientAnamnesisSortableHeader
            label="Data de Emissão"
            column="issuedAt"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-sm text-foreground">
            {formatAnamnesisDate(row.original.issuedAt)}
          </span>
        ),
      },
      {
        id: 'templateName',
        accessorKey: 'templateName',
        header: () => (
          <PatientAnamnesisSortableHeader
            label="Modelo da anamnese"
            column="templateName"
            sort={sort}
            onSort={handleSort}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">{row.original.templateName}</span>
        ),
      },
      {
        id: 'status',
        accessorKey: 'status',
        header: 'Status',
        enableSorting: false,
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={cn(
              'font-normal',
              PATIENT_ANAMNESIS_STATUS_BADGE_CLASS[row.original.status],
            )}
          >
            {PATIENT_ANAMNESIS_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        id: 'signatureStatus',
        accessorKey: 'signatureStatus',
        header: 'Assinatura eletrônica',
        enableSorting: false,
        cell: ({ row }) => {
          const { signatureStatus, id } = row.original;
          const requestedAt = signatureRequestedAtById[id];
          return (
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <Badge
                variant="outline"
                className={cn(
                  'font-normal',
                  PATIENT_ANAMNESIS_SIGNATURE_STATUS_BADGE_CLASS[signatureStatus],
                )}
              >
                {PATIENT_ANAMNESIS_SIGNATURE_STATUS_LABEL[signatureStatus]}
              </Badge>
              {signatureStatus === 'pending' && requestedAt ? (
                <span className="text-xs text-muted-foreground">
                  <span className="font-semibold text-muted-foreground">Emitido</span>
                  {`: ${formatPatientAnamnesisSignatureIssuedAt(requestedAt)}`}
                </span>
              ) : null}
            </div>
          );
        },
      },
      {
        id: 'actions',
        header: () => (
          <span className="block w-full text-right font-medium text-foreground">Ações</span>
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex justify-end">
            <PatientAnamnesisActionsMenu
              anamnesis={row.original}
              onAction={(action) => onAnamnesisAction(row.original, action)}
            />
          </div>
        ),
      },
    ],
    [handleSort, onAnamnesisAction, signatureRequestedAtById, sort],
  );

  return (
    <div className={PATIENT_TABLE_CARD_CLASS}>
      {header ? <div className="mb-4">{header}</div> : null}
      <DataTable
        columns={columns}
        data={anamneses}
        pageSize={pageSize}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={meta.total}
        entityName="anamnese"
        emptyMessage={emptyMessage}
        emptyPaginationLabel="Nenhuma anamnese"
        enableSorting={false}
        paginationClassName="hidden"
        tableClassName={PATIENT_DATA_TABLE_CLASS}
        headerClassName={PATIENT_DATA_TABLE_HEADER_WITH_ACTIONS_CLASS}
      />

      <PatientAnamnesesPaginationBar
        page={page}
        pageSize={pageSize}
        total={meta.total}
        totalPages={totalPages}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
