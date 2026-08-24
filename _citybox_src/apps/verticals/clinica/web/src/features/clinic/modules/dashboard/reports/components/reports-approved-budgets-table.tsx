'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatCpf } from '@/features/shared/fiscal/cpf';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { formatDashboardCurrencyFromCents } from '../../lib/format-dashboard-currency';
import { useReportApprovedBudgetsQuery } from '../hooks/use-report-approved-budgets-query';
import { useReportOpenBudgetsQuery } from '../hooks/use-report-open-budgets-query';
import { useReportRejectedBudgetsQuery } from '../hooks/use-report-rejected-budgets-query';
import { formatReportBudgetStatusLabel } from '../lib/format-report-budget-status';
import { resolveReportBudgetPeriodRange } from '../lib/reports-period';
import type {
  ReportBudgetPeriodMode,
  ReportBudgetRow,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

type ReportsBudgetPeriodTableProps = {
  budgetPeriodMode: ReportBudgetPeriodMode;
  budgetMonth: number;
  budgetYear: number;
};

export function ReportsApprovedBudgetsTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsBudgetPeriodTableProps) {
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
    useReportApprovedBudgetsQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  return (
    <ReportsBudgetPeriodTableView
      data={data}
      isLoading={isLoading}
      isPending={isPending}
      isError={isError}
      isFetching={isFetching}
      page={page}
      onPageChange={setPage}
      loadingLabel="Carregando orçamentos…"
      errorLabel="Não foi possível carregar os orçamentos aprovados."
      emptyMessage="Nenhum orçamento aprovado no período."
    />
  );
}

export function ReportsOpenBudgetsTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsBudgetPeriodTableProps) {
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
    useReportOpenBudgetsQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  return (
    <ReportsBudgetPeriodTableView
      data={data}
      isLoading={isLoading}
      isPending={isPending}
      isError={isError}
      isFetching={isFetching}
      page={page}
      onPageChange={setPage}
      loadingLabel="Carregando orçamentos…"
      errorLabel="Não foi possível carregar os orçamentos em aberto."
      emptyMessage="Nenhum orçamento em aberto no período."
    />
  );
}

export function ReportsRejectedBudgetsTable({
  budgetPeriodMode,
  budgetMonth,
  budgetYear,
}: ReportsBudgetPeriodTableProps) {
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
    useReportRejectedBudgetsQuery({
      startDate: range.startDate,
      endDate: range.endDate,
      page,
      perPage: PER_PAGE,
    });

  return (
    <ReportsBudgetPeriodTableView
      data={data}
      isLoading={isLoading}
      isPending={isPending}
      isError={isError}
      isFetching={isFetching}
      page={page}
      onPageChange={setPage}
      loadingLabel="Carregando orçamentos…"
      errorLabel="Não foi possível carregar os orçamentos reprovados."
      emptyMessage="Nenhum orçamento reprovado no período."
    />
  );
}

type ReportsBudgetPeriodTableViewProps = {
  data:
    | {
        items: ReportBudgetRow[];
        meta?: { totalPages?: number; total?: number };
      }
    | undefined;
  isLoading: boolean;
  isPending: boolean;
  isError: boolean;
  isFetching: boolean;
  page: number;
  onPageChange: (page: number) => void;
  loadingLabel: string;
  errorLabel: string;
  emptyMessage: string;
};

function ReportsBudgetPeriodTableView({
  data,
  isLoading,
  isPending,
  isError,
  isFetching,
  page,
  onPageChange,
  loadingLabel,
  errorLabel,
  emptyMessage,
}: ReportsBudgetPeriodTableViewProps) {
  const columns = useMemo<ColumnDef<ReportBudgetRow>[]>(
    () => buildBudgetColumns({ formatStatus: true }),
    [],
  );

  const rows = Array.isArray(data?.items) ? data.items : [];
  const meta = data?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);
  const total = meta?.total ?? 0;

  if ((isLoading || isPending) && !data) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        {loadingLabel}
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">{errorLabel}</p>
    );
  }

  if (rows.length === 0) {
    return (
      <ReportsEmptyState
        title={emptyMessage}
        description="Confira o filtro Anual/Mensal ou o status do orçamento na ficha do paciente."
      />
    );
  }

  return (
    <div className={isFetching ? 'opacity-80' : undefined}>
      <ReportsDataTable
        columns={columns}
        data={[...rows]}
        pageSize={PER_PAGE}
        entityName="orçamentos"
        emptyMessage={emptyMessage}
        emptyPaginationLabel="Nenhum orçamento"
        enableSorting={false}
        manualPagination
        pageIndex={page - 1}
        pageCount={totalPages}
        totalRowCount={total}
        onPageIndexChange={(pageIndex) => onPageChange(pageIndex + 1)}
        paginationClassName={total <= PER_PAGE ? 'hidden' : undefined}
      />
    </div>
  );
}

function buildBudgetColumns(options: {
  formatStatus: boolean;
}): ColumnDef<ReportBudgetRow>[] {
  return [
    {
      id: 'budgetDate',
      accessorKey: 'budgetDate',
      header: 'Data',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatLocalDateBr(row.original.budgetDate)}
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
    {
      id: 'mobile',
      accessorKey: 'mobile',
      header: 'Celular Paciente',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatPhone(row.original.mobile) || '—'}
        </span>
      ),
    },
    {
      id: 'email',
      accessorKey: 'email',
      header: 'E-mail',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="truncate text-foreground">
          {row.original.email || '—'}
        </span>
      ),
    },
    {
      id: 'responsibleMobile',
      accessorKey: 'responsibleMobile',
      header: 'Celular Responsável',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {formatPhone(row.original.responsibleMobile) || '—'}
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
            className="block min-w-0 max-w-full truncate text-foreground"
            title={description !== '—' ? description : undefined}
          >
            {description}
          </span>
        );
      },
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status do Orçamento',
      enableSorting: false,
      cell: ({ row }) => (
        <span className="text-foreground">
          {options.formatStatus
            ? formatReportBudgetStatusLabel(row.original.status)
            : row.original.status || '—'}
        </span>
      ),
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
  ];
}
