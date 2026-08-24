'use client';

import { useMemo, type ReactNode } from 'react';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  formatPatientBmi,
  resolvePatientImcStage,
} from '@/lib/patient-imc';
import { formatPatientBirthDate } from '../../../lib/format-patient-profile';
import type { PatientBodyMetric } from '../../../types/patient-body-metric';
import {
  PATIENT_DATA_TABLE_CLASS,
  PATIENT_DATA_TABLE_HEADER_CLASS,
  PATIENT_TABLE_CARD_CLASS,
} from '../../../lib/patient-detail-tabs-ui';
import {
  PatientBodyMetricsPaginationBar,
  type PatientBodyMetricPageSize,
} from './patient-body-metrics-pagination-bar';

type PatientBodyMetricsTableProps = {
  metrics: PatientBodyMetric[];
  meta: {
    total: number;
    page: number;
    perPage: number;
    totalPages: number;
  };
  page: number;
  pageSize: PatientBodyMetricPageSize;
  emptyMessage: string;
  header?: ReactNode;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: PatientBodyMetricPageSize) => void;
};

export function PatientBodyMetricsTable({
  metrics,
  meta,
  page,
  pageSize,
  emptyMessage,
  header,
  onPageChange,
  onPageSizeChange,
}: PatientBodyMetricsTableProps) {
  const totalPages = Math.max(1, meta.totalPages || 1);

  const columns = useMemo<ColumnDef<PatientBodyMetric>[]>(
    () => [
      {
        id: 'measuredAt',
        accessorKey: 'measuredAt',
        header: 'Data',
        cell: ({ row }) => formatPatientBirthDate(row.original.measuredAt),
      },
      {
        id: 'weightKg',
        accessorKey: 'weightKg',
        header: 'Peso',
        cell: ({ row }) =>
          `${row.original.weightKg.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`,
      },
      {
        id: 'heightCm',
        accessorKey: 'heightCm',
        header: 'Altura',
        cell: ({ row }) =>
          `${row.original.heightCm.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} cm`,
      },
      {
        id: 'bmi',
        accessorKey: 'bmi',
        header: 'IMC',
        cell: ({ row }) => formatPatientBmi(row.original.bmi),
      },
      {
        id: 'obesityType',
        header: 'Tipo de obesidade',
        cell: ({ row }) => resolvePatientImcStage(row.original.bmi).obesityTypeLabel,
      },
      {
        id: 'riskGrade',
        header: 'Grau de risco',
        cell: ({ row }) => resolvePatientImcStage(row.original.bmi).riskGradeLabel,
      },
      {
        id: 'professionalName',
        accessorKey: 'professionalName',
        header: 'Profissional',
        cell: ({ row }) => row.original.professionalName?.trim() || '—',
      },
      {
        id: 'notes',
        accessorKey: 'notes',
        header: 'Observações',
        cell: ({ row }) => {
          const notes = row.original.notes?.trim();
          if (!notes) return '—';
          return (
            <span className="line-clamp-2 max-w-[14rem] whitespace-pre-wrap" title={notes}>
              {notes}
            </span>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className={PATIENT_TABLE_CARD_CLASS}>
      {header ? <div className="mb-4">{header}</div> : null}
      <DataTable
        columns={columns}
        data={metrics}
        pageSize={pageSize}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={meta.total}
        entityName="medição"
        emptyMessage={emptyMessage}
        emptyPaginationLabel="Nenhuma medição"
        enableSorting={false}
        paginationClassName="hidden"
        tableClassName={PATIENT_DATA_TABLE_CLASS}
        headerClassName={PATIENT_DATA_TABLE_HEADER_CLASS}
      />
      <PatientBodyMetricsPaginationBar
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
