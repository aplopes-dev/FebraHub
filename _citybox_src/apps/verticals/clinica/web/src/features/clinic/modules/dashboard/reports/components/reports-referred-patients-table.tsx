'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { useReportReferredPatientsQuery } from '../hooks/use-report-referred-patients-query';
import { resolveReportBudgetPeriodRange } from '../lib/reports-period';
import type {
  ReportBudgetPeriodMode,
  ReportReferredPatientRow,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

type ReportsReferredPatientsTableProps = {
  budgetPeriodMode: ReportBudgetPeriodMode;
  budgetMonth: number;
  budgetYear: number;
};

export function ReportsReferredPatientsTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsReferredPatientsTableProps) {
  const [page, setPage] = useState(1);
  const range = useMemo(
    () =>
      resolveReportBudgetPeriodRange({
        mode: budgetPeriodMode,
        year: budgetYear,
        month: budgetMonth,
      }),
    [budgetPeriodMode, budgetMonth, budgetYear],
  );

  useEffect(() => {
    setPage(1);
  }, [range.startDate, range.endDate]);

  const { data, isLoading, isPending, isError, isFetching } =
    useReportReferredPatientsQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  const columns = useMemo<ColumnDef<ReportReferredPatientRow>[]>(
    () => [
      {
        id: 'referredPatientName',
        accessorKey: 'referredPatientName',
        header: 'Paciente indicado',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.referredPatientName}
          </span>
        ),
      },
      {
        id: 'referredBy',
        accessorKey: 'referredBy',
        header: 'Quem indicou?',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.referredBy || '—'}
          </span>
        ),
      },
      {
        id: 'referralDate',
        accessorKey: 'referralDate',
        header: 'Data da indicação',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatLocalDateBr(row.original.referralDate)}
          </span>
        ),
      },
      {
        id: 'firstAppointmentDate',
        accessorKey: 'firstAppointmentDate',
        header: 'Primeira consulta',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.firstAppointmentDate
              ? formatLocalDateBr(row.original.firstAppointmentDate)
              : '—'}
          </span>
        ),
      },
      {
        id: 'approvedBudgetsCount',
        accessorKey: 'approvedBudgetsCount',
        header: 'Orçamentos aprovados',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.approvedBudgetsCount}
          </span>
        ),
      },
    ],
    [],
  );

  const rows = Array.isArray(data?.items) ? data.items : [];
  const meta = data?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);
  const total = meta?.total ?? 0;

  if ((isLoading || isPending) && !data) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando pacientes indicados…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar os pacientes indicados.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        title="Nenhum paciente indicado no período."
        description="Confira o filtro Anual/Mensal ou a origem “Indicação” no cadastro."
      />
    );
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="pacientes"
        emptyMessage="Nenhum paciente indicado no período."
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
