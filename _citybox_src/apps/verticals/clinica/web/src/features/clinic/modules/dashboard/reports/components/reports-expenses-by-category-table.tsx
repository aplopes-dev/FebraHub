'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatDashboardCurrencyFromCents } from '../../lib/format-dashboard-currency';
import { useReportExpensesByCategoryQuery } from '../hooks/use-report-expenses-by-category-query';
import { resolveReportBudgetPeriodRange } from '../lib/reports-period';
import type {
  ReportBudgetPeriodMode,
  ReportExpensesByCategoryRow,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

function formatPercentage(value: number): string {
  return `${value.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`;
}

type ReportsExpensesByCategoryTableProps = {
  budgetPeriodMode: ReportBudgetPeriodMode;
  budgetMonth: number;
  budgetYear: number;
};

export function ReportsExpensesByCategoryTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsExpensesByCategoryTableProps) {
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
    useReportExpensesByCategoryQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  const columns = useMemo<ColumnDef<ReportExpensesByCategoryRow>[]>(
    () => [
      {
        id: 'categoryName',
        accessorKey: 'categoryName',
        header: 'Categoria',
        enableSorting: false,
        cell: ({ row }) => {
          const category = row.original.categoryName || '—';

          return (
            <span
              className="block min-w-0 max-w-full truncate font-medium text-foreground"
              title={category !== '—' ? category : undefined}
            >
              {category}
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
      {
        id: 'percentage',
        accessorKey: 'percentage',
        header: 'Porcentagem',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatPercentage(row.original.percentage)}
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
        Carregando despesas…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar as despesas por categoria.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        title="Nenhuma despesa por categoria no período."
        description="Confira o filtro Anual/Mensal ou as despesas pagas no financeiro."
      />
    );
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="categorias"
        emptyMessage="Nenhuma despesa por categoria no período."
        emptyPaginationLabel="Nenhuma categoria"
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
