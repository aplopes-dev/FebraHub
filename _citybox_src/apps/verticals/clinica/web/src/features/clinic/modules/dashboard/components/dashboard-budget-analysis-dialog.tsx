'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from '@citybox/ui/atoms';
import { SearchInput } from '@citybox/ui/molecules';
import { DataTable, type ColumnDef } from '@citybox/ui/organisms';
import {
  ERP_DATA_TABLE_RESPONSIVE_SCROLL_CLASS,
  erpDataTableStyleProps,
} from '@/features/shared/lib/data-table-styles';
import { useDebouncedSearch } from '@/features/clinic/modules/patients/hooks/use-debounced-search';
import { downloadPatientDocumentPdf } from '@/features/clinic/modules/patients/lib/patient-document-pdf-actions';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { getClinicProfile } from '@/features/clinic/modules/settings/services/clinic-profile.service';
import type {
  BudgetAnalysisDimension,
  BudgetPeriodMode,
  DashboardBudgetAnalysisRow,
  DashboardBudgetAnalysisStatus,
} from '../types/clinic-dashboard';
import { formatDashboardCurrencyFromCents } from '../lib/format-dashboard-currency';
import { formatLocalDateBr } from '../lib/dashboard-dates';
import {
  buildBudgetAnalysisDetailPdf,
  buildBudgetAnalysisPdfFileName,
  mapClinicSettingsToBudgetAnalysisPdfClinic,
} from '../lib/build-dashboard-budget-analysis-pdf';
import { useDashboardBudgetAnalysisDetailsQuery } from '../hooks/use-dashboard-budget-analysis-details-query';
import { fetchDashboardBudgetAnalysisDetails } from '../services/dashboard.api.service';

const PAGE_SIZE = 20;

type DashboardBudgetAnalysisDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  titleAccent?: string;
  status: DashboardBudgetAnalysisStatus;
  periodMode: BudgetPeriodMode;
  year: number;
  month?: number;
  professionalId?: string;
  dimension?: BudgetAnalysisDimension;
  dimensionKey?: string;
};

function DetailField({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

export function DashboardBudgetAnalysisDialog({
  open,
  onOpenChange,
  title,
  titleAccent,
  status,
  periodMode,
  year,
  month,
  professionalId,
  dimension,
  dimensionKey,
}: DashboardBudgetAnalysisDialogProps) {
  const { clinicId } = useClinicId();
  const [page, setPage] = useState(1);
  const [searchOpen, setSearchOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();

  useEffect(() => {
    setPage(1);
  }, [
    status,
    periodMode,
    year,
    month,
    professionalId,
    dimension,
    dimensionKey,
    debouncedSearch,
  ]);

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardBudgetAnalysisDetailsQuery(
      {
        status,
        periodMode,
        year,
        month,
        professionalId,
        dimension,
        dimensionKey,
        page,
        perPage: PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
      { enabled: open },
    );

  const columns = useMemo<ColumnDef<DashboardBudgetAnalysisRow>[]>(
    () => [
      {
        accessorKey: 'budgetDate',
        header: 'Dt. Orçamento',
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatLocalDateBr(row.original.budgetDate)}
          </span>
        ),
      },
      {
        accessorKey: 'patientName',
        header: 'Paciente',
        cell: ({ row }) => (
          <Link
            href={`/pacientes/${row.original.patientId}/sobre`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline underline-offset-4 hover:no-underline"
          >
            {row.original.patientName}
            <span className="sr-only"> (abre em nova aba)</span>
          </Link>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Descrição do orçamento',
        cell: ({ row }) => (
          <span className="line-clamp-2 break-words">{row.original.description}</span>
        ),
      },
      {
        accessorKey: 'valueCents',
        header: 'Valor',
        cell: ({ row }) => (
          <span className="block whitespace-nowrap text-right font-medium tabular-nums">
            {formatDashboardCurrencyFromCents(row.original.valueCents)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearchOpen(false);
      clearSearch();
      setPage(1);
    }
    onOpenChange(nextOpen);
  };

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const all: DashboardBudgetAnalysisRow[] = [];
      let currentPage = 1;
      let totalPages = 1;
      do {
        const result = await fetchDashboardBudgetAnalysisDetails(clinicId, {
          status,
          periodMode,
          year,
          month,
          professionalId,
          dimension,
          dimensionKey,
          page: currentPage,
          perPage: 100,
          search: debouncedSearch || undefined,
        });
        all.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildBudgetAnalysisDetailPdf({
        title,
        budgets: all,
        clinic: mapClinicSettingsToBudgetAnalysisPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(
        blob,
        buildBudgetAnalysisPdfFileName(titleAccent ?? title),
      );
      toast.success('PDF exportado');
    } catch {
      toast.error('Não foi possível exportar o PDF');
    } finally {
      setIsExporting(false);
    }
  };

  const canGoPrev = page > 1;
  const canGoNext = page < Math.max(meta.totalPages, 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-[calc(100%-1.5rem)] flex-col gap-0 p-0 sm:w-full sm:max-w-6xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="min-w-0 text-pretty">
              {title}
              {titleAccent ? (
                <span className="text-primary"> {titleAccent}</span>
              ) : null}
            </DialogTitle>
            <div className="flex shrink-0 flex-wrap items-center gap-2">
              {searchOpen ? (
                <div className="flex items-center gap-2">
                  <SearchInput
                    autoFocus
                    value={search}
                    onChange={(event) =>
                      handleSearchChange(event.target.value)
                    }
                    placeholder="Buscar paciente…"
                    aria-label="Buscar paciente"
                    containerClassName="w-full max-w-56"
                    className="h-9"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Fechar busca"
                    onClick={() => {
                      clearSearch();
                      setSearchOpen(false);
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Abrir busca"
                  onClick={() => setSearchOpen(true)}
                >
                  <Search className="size-4" />
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isExporting || meta.total === 0}
                onClick={() => void handleExport()}
              >
                <Download className="size-4" />
                Exportar
              </Button>
            </div>
          </div>
          <DialogDescription className="sr-only">
            Lista de orçamentos do dashboard
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando orçamentos…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os orçamentos.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum orçamento encontrado.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3 lg:hidden">
                {items.map((budget) => (
                  <li key={budget.id}>
                    <Card className="min-w-0 py-0">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/pacientes/${budget.patientId}/sobre`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 break-words font-medium text-primary underline underline-offset-4 hover:no-underline"
                          >
                            {budget.patientName}
                            <span className="sr-only"> (abre em nova aba)</span>
                          </Link>
                          <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                            {formatDashboardCurrencyFromCents(budget.valueCents)}
                          </span>
                        </div>
                        <dl className="grid grid-cols-1 gap-2">
                          <DetailField label="Dt. Orçamento">
                            {formatLocalDateBr(budget.budgetDate)}
                          </DetailField>
                          <DetailField label="Descrição do orçamento">
                            {budget.description}
                          </DetailField>
                        </dl>
                      </CardContent>
                    </Card>
                  </li>
                ))}
              </ul>

              <div className={ERP_DATA_TABLE_RESPONSIVE_SCROLL_CLASS}>
                <DataTable
                  columns={columns}
                  data={items}
                  manualPagination
                  pageIndex={page - 1}
                  pageCount={Math.max(meta.totalPages, 1)}
                  totalRowCount={meta.total}
                  pageSize={PAGE_SIZE}
                  paginationClassName="hidden"
                  colgroup={
                    <colgroup>
                      <col className="w-[15%]" />
                      <col className="w-[24%]" />
                      <col className="w-[43%]" />
                      <col className="w-[18%]" />
                    </colgroup>
                  }
                  {...erpDataTableStyleProps}
                />
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-sm text-muted-foreground">
            {!isLoading && !isError
              ? `Total ${formatDashboardCurrencyFromCents(meta.totalValueCents)} · ${meta.total} registro(s)${isFetching ? ' · atualizando…' : ''}`
              : null}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {meta.totalPages > 1 ? (
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoPrev || isLoading}
                  aria-label="Página anterior"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {page} / {Math.max(meta.totalPages, 1)}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!canGoNext || isLoading}
                  aria-label="Próxima página"
                  onClick={() =>
                    setPage((current) =>
                      Math.min(Math.max(meta.totalPages, 1), current + 1),
                    )
                  }
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
