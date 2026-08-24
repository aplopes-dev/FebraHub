'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { formatPhone } from '@/features/clinic/modules/settings/lib/format-clinic-fields';
import { formatLocalDateBr } from '../../lib/dashboard-dates';
import { useReportBirthdaysQuery } from '../hooks/use-report-birthdays-query';
import { resolveReportBirthdayRange } from '../lib/reports-period';
import type {
  ReportBirthdayRow,
  ReportPeriodFilter,
} from '../types/clinic-reports';
import { ReportsDataTable } from './reports-data-table';
import { ReportsEmptyState } from './reports-empty-state';

const PER_PAGE = 20;

type ReportsBirthdaysTableProps = {
  period: ReportPeriodFilter;
};

export function ReportsBirthdaysTable({ period }: ReportsBirthdaysTableProps) {
  const [page, setPage] = useState(1);
  const range = useMemo(() => resolveReportBirthdayRange(period), [period]);

  useEffect(() => {
    setPage(1);
  }, [period, range.startDate, range.endDate]);

  const { data, isLoading, isError, isFetching } = useReportBirthdaysQuery({
    startDate: range.startDate,
    endDate: range.endDate,
    page,
    perPage: PER_PAGE,
    status: 'active',
  });

  const columns = useMemo<ColumnDef<ReportBirthdayRow>[]>(
    () => [
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
        id: 'birthDate',
        accessorKey: 'birthDate',
        header: 'Data do aniversário',
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground">
            {formatLocalDateBr(row.original.birthDate)}
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
    ],
    [],
  );

  const rows = data?.items ?? [];
  const meta = data?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);
  const total = meta?.total ?? 0;

  if (isLoading && !data) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Carregando aniversariantes…
      </p>
    );
  }

  if (isError) {
    return (
      <p className="py-10 text-center text-sm text-destructive">
        Não foi possível carregar os aniversariantes.
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
        entityName="aniversariantes"
        emptyMessage="Nenhum aniversariante no período."
        emptyPaginationLabel="Nenhum aniversariante"
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
