'use client';

import { useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatCpf } from '@/features/shared/fiscal/cpf';
import { useReportOpenTreatmentsWithoutAppointmentQuery } from '../hooks/use-report-open-treatments-query';
import type { ReportOpenTreatmentsWithoutAppointmentRow } from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

export function ReportsOpenTreatmentsWithoutAppointmentTable() {
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, isFetching } =
    useReportOpenTreatmentsWithoutAppointmentQuery({
      page,
      perPage: PER_PAGE,
      status: 'active',
    });

  const columns: ColumnDef<ReportOpenTreatmentsWithoutAppointmentRow>[] = [
    {
      id: 'patientName',
      accessorKey: 'patientName',
      header: 'Paciente',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="font-medium text-foreground">
          {row.original.patientName}
        </span>
      ),
    },
    {
      id: 'phone',
      accessorKey: 'phone',
      header: 'Telefone',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatPhone(row.original.phone) || '—'}
        </span>
      ),
    },
    {
      id: 'mobile',
      accessorKey: 'mobile',
      header: 'Celular',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatPhone(row.original.mobile) || '—'}
        </span>
      ),
    },
    {
      id: 'document',
      accessorKey: 'document',
      header: 'Documento',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatCpf(row.original.document) || '—'}
        </span>
      ),
    },
  ];

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);
  const total = meta?.total ?? 0;

  if (isLoading && !data) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando pacientes…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar o relatório.
      </p>
    );
  }

  if (rows.length === 0) {
    return <ReportsEmptyState />;
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="pacientes"
        emptyMessage="Nenhum paciente encontrado."
        emptyPaginationLabel="Nenhum paciente"
        enableSorting={false}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={total}
        onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
        paginationClassName={total <= PER_PAGE ? 'hidden' : undefined}
      />
    </div>
  );
}
