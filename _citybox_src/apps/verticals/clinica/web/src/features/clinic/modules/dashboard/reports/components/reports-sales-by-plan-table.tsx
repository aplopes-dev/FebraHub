'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../../lib/format-dashboard-currency';
import { useReportSalesByPlanQuery } from '../hooks/use-report-sales-by-plan-query';
import { resolveReportBudgetPeriodRange } from '../lib/reports-period';
import type {
  ReportBudgetPeriodMode,
  ReportSalesByPlanRow,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

type ReportsSalesByPlanTableProps = {
  budgetPeriodMode: ReportBudgetPeriodMode;
  budgetMonth: number;
  budgetYear: number;
};

export function ReportsSalesByPlanTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsSalesByPlanTableProps) {
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
    useReportSalesByPlanQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  const columns = useMemo<ColumnDef<ReportSalesByPlanRow>[]>(
    () => [
      {
        id: 'planName',
        accessorKey: 'planName',
        header: 'Plano',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.planName || '—'}
          </span>
        ),
      },
      {
        id: 'saleDate',
        accessorKey: 'saleDate',
        header: 'Data de venda',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatLocalDateBr(row.original.saleDate)}
          </span>
        ),
      },
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
        id: 'treatmentName',
        accessorKey: 'treatmentName',
        header: 'Procedimento',
        enableSorting: false,
        cell: ({ row }) => {
          const treatment = row.original.treatmentName || '—';

          return (
            <span
              className="block min-w-0 max-w-full truncate text-foreground"
              title={treatment !== '—' ? treatment : undefined}
            >
              {treatment}
            </span>
          );
        },
      },
      {
        id: 'valueCents',
        accessorKey: 'valueCents',
        header: 'Valor',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatDashboardCurrencyFromCents(row.original.valueCents)}
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
        Carregando vendas…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar as vendas por plano.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        title="Nenhuma venda por plano no período."
        description="Confira o filtro Anual/Mensal ou os orçamentos aprovados na ficha."
      />
    );
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="vendas"
        emptyMessage="Nenhuma venda por plano no período."
        emptyPaginationLabel="Nenhuma venda"
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
