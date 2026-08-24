'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../../lib/format-dashboard-currency';
import { useReportExcludedRevenuesQuery } from '../hooks/use-report-excluded-revenues-query';
import { resolveReportBirthdayRange } from '../lib/reports-period';
import type {
  ReportExcludedRevenueRow,
  ReportPeriodFilter,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

type ReportsExcludedRevenuesTableProps = {
  period: ReportPeriodFilter;
};

export function ReportsExcludedRevenuesTable({
  period,
}: ReportsExcludedRevenuesTableProps) {
  const [page, setPage] = useState(1);
  const range = useMemo(() => resolveReportBirthdayRange(period), [period]);

  useEffect(() => {
    setPage(1);
  }, [period, range.startDate, range.endDate]);

  const { data, isLoading, isPending, isError, isFetching } =
    useReportExcludedRevenuesQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  const columns = useMemo<ColumnDef<ReportExcludedRevenueRow>[]>(
    () => [
      {
        id: 'patientName',
        accessorKey: 'patientName',
        header: 'Nome do Paciente',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="font-medium text-foreground">
            {row.original.patientName}
          </span>
        ),
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: 'Descrição',
        enableSorting: false,
        cell: ({ row }) => {
          const description = row.original.description || '—';

          return (
            <span
              className="block min-w-0 max-w-[18rem] truncate text-foreground"
              title={description !== '—' ? description : undefined}
            >
              {description}
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
        id: 'excludedAt',
        accessorKey: 'excludedAt',
        header: 'Data da exclusão',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatLocalDateBr(row.original.excludedAt)}
          </span>
        ),
      },
      {
        id: 'excludedBy',
        accessorKey: 'excludedBy',
        header: 'Excluído por',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {row.original.excludedBy || '—'}
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

  if ((isLoading || isPending || isFetching) && rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando receitas excluídas…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar as receitas excluídas.
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        title="Nenhuma receita excluída no período."
        description="Confira o filtro de período ou os cancelamentos de recebimento no financeiro."
      />
    );
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="receitas"
        emptyMessage="Nenhuma receita excluída no período."
        emptyPaginationLabel="Nenhuma receita"
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
