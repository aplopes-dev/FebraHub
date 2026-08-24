'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ColumnDef } from '@citybox/ui/organisms';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@citybox/ui/atoms';
import { DataTable } from '@citybox/ui/organisms';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { buildPatientWhatsAppUrl } from '@/features/clinic/modules/dashboard/lib/build-patient-whatsapp-url';
import { WhatsappBrandIcon } from '@/features/clinic/modules/settings/whatsapp/components/whatsapp-brand-icon';
import { reportsDataTableStyleProps } from '@/features/clinic/modules/dashboard/reports/lib/reports-data-table-styles';
import { formatIndicacoesReferralCountLabel, formatIndicacoesReferrerKindLabel } from '../lib/format-indicacoes-referrer-kind';
import { openIndicacoesWhatsApp } from '../lib/open-indicacoes-whatsapp';
import { useIndicacoesReferrersQuery } from '../hooks/use-indicacoes-referrers-query';
import { IndicacoesPeriodFilters } from './indicacoes-period-filters';
import { IndicacoesReferrerPatientsDialog } from './indicacoes-referrer-patients-dialog';
import {
  DEFAULT_INDICACOES_PAGE_SIZE,
  IndicacoesPaginationBar,
  type IndicacoesPageSize,
} from './indicacoes-pagination-bar';
import type { IndicacoesPeriodMode, IndicacoesReferrer } from '../types/indicacoes';

type ReferrerSortColumn = 'totalReferrals' | 'approvedBudgetsCount';
type ReferrerSortDirection = 'asc' | 'desc';

type IndicacoesReferrersSectionProps = {
  mode: IndicacoesPeriodMode;
  year: number;
  month: number;
  years: number[];
  onModeChange: (mode: IndicacoesPeriodMode) => void;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
};

function SortableHeader({
  label,
  active,
  direction,
  onToggle,
}: {
  label: string;
  active: boolean;
  direction: ReferrerSortDirection;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="inline-flex w-full items-center justify-start gap-2 font-medium text-foreground"
      onClick={onToggle}
      aria-label={`Ordenar por ${label}`}
    >
      {label}
      {active && direction === 'asc' ? (
        <ArrowUp className="size-4" aria-hidden />
      ) : active && direction === 'desc' ? (
        <ArrowDown className="size-4" aria-hidden />
      ) : (
        <ArrowUpDown className="size-4 text-muted-foreground" aria-hidden />
      )}
    </button>
  );
}

export function IndicacoesReferrersSection({
  mode,
  year,
  month,
  years,
  onModeChange,
  onMonthChange,
  onYearChange,
}: IndicacoesReferrersSectionProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<IndicacoesPageSize>(
    DEFAULT_INDICACOES_PAGE_SIZE,
  );
  const [sortColumn, setSortColumn] =
    useState<ReferrerSortColumn>('totalReferrals');
  const [sortDirection, setSortDirection] =
    useState<ReferrerSortDirection>('desc');
  const [selectedReferrer, setSelectedReferrer] =
    useState<IndicacoesReferrer | null>(null);

  useEffect(() => {
    setPage(1);
  }, [mode, month, year, sortColumn, sortDirection, pageSize]);

  const query = useIndicacoesReferrersQuery({
    periodMode: mode,
    year,
    month: mode === 'monthly' ? month : undefined,
    page,
    perPage: pageSize,
    sortBy: sortColumn,
    sortOrder: sortDirection,
  });

  const rows = query.data?.items ?? [];
  const meta = query.data?.meta;
  const total = meta?.total ?? 0;
  const totalPages = Math.max(meta?.totalPages ?? 0, 1);

  function toggleSort(column: ReferrerSortColumn) {
    if (sortColumn === column) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortColumn(column);
    setSortDirection('desc');
  }

  const columns = useMemo<ColumnDef<IndicacoesReferrer>[]>(
    () => [
      {
        id: 'name',
        accessorKey: 'name',
        header: 'Nome',
        enableSorting: false,
        cell: ({ row }) => (
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="font-medium text-foreground">
              {row.original.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {formatIndicacoesReferrerKindLabel(row.original.kind)}
            </span>
          </div>
        ),
      },
      {
        id: 'totalReferrals',
        accessorKey: 'totalReferrals',
        header: () => (
          <SortableHeader
            label="Total de indicações"
            active={sortColumn === 'totalReferrals'}
            direction={sortDirection}
            onToggle={() => toggleSort('totalReferrals')}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <Button
            type="button"
            variant="link"
            className="h-auto px-0 font-medium tabular-nums"
            onClick={() => setSelectedReferrer(row.original)}
          >
            {formatIndicacoesReferralCountLabel(row.original.totalReferrals)}
          </Button>
        ),
      },
      {
        id: 'approvedBudgetsCount',
        accessorKey: 'approvedBudgetsCount',
        header: () => (
          <SortableHeader
            label="Orçamentos aprovados"
            active={sortColumn === 'approvedBudgetsCount'}
            direction={sortDirection}
            onToggle={() => toggleSort('approvedBudgetsCount')}
          />
        ),
        enableSorting: false,
        cell: ({ row }) => (
          <span className="text-foreground tabular-nums">
            {row.original.approvedBudgetsCount}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => {
          const whatsappUrl = buildPatientWhatsAppUrl(
            row.original.phone,
            row.original.name,
          );
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-[#1FA855] hover:text-[#1FA855]"
              disabled={!whatsappUrl}
              aria-label={`Conversar com ${row.original.name} pelo WhatsApp`}
              onClick={() =>
                openIndicacoesWhatsApp(row.original.phone, row.original.name)
              }
            >
              <WhatsappBrandIcon className="size-4" />
              Conversar
            </Button>
          );
        },
      },
    ],
    [sortColumn, sortDirection],
  );

  return (
    <>
    <Card className="py-0">
      <CardHeader className="flex flex-col gap-3 space-y-0 border-b px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base font-semibold">
          Pacientes e profissionais indicadores
        </CardTitle>
        <IndicacoesPeriodFilters
          mode={mode}
          month={month}
          year={year}
          years={years}
          onModeChange={onModeChange}
          onMonthChange={onMonthChange}
          onYearChange={onYearChange}
        />
      </CardHeader>
      <CardContent className="space-y-4 px-4 py-4">
        {query.isLoading ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Carregando indicadores…
          </p>
        ) : query.isError ? (
          <p className="py-10 text-center text-sm text-destructive">
            Não foi possível carregar os indicadores.
          </p>
        ) : total === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhum indicador no período selecionado.
          </p>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={rows}
              pageSize={pageSize}
              entityName="indicadores"
              emptyMessage="Nenhum indicador no período."
              emptyPaginationLabel="Nenhum indicador"
              enableSorting={false}
              manualPagination
              pageIndex={page - 1}
              pageCount={totalPages}
              totalRowCount={total}
              onPageIndexChange={(pageIndex) => setPage(pageIndex + 1)}
              paginationClassName="hidden"
              className={reportsDataTableStyleProps.className}
              tableWrapperClassName={
                reportsDataTableStyleProps.tableWrapperClassName
              }
              tableClassName={reportsDataTableStyleProps.tableClassName}
              headerClassName={reportsDataTableStyleProps.headerClassName}
            />
            <IndicacoesPaginationBar
              page={page}
              pageSize={pageSize}
              total={total}
              totalPages={totalPages}
              entitySingular="indicador"
              entityPlural="indicadores"
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </CardContent>
    </Card>
    {selectedReferrer ? (
      <IndicacoesReferrerPatientsDialog
        open
        onOpenChange={(next) => {
          if (!next) setSelectedReferrer(null);
        }}
        referrerId={selectedReferrer.id}
        referrerName={selectedReferrer.name}
        referrerKind={selectedReferrer.kind}
        periodMode={mode}
        year={year}
        month={month}
        totalReferrals={selectedReferrer.totalReferrals}
      />
    ) : null}
    </>
  );
}
