"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, X } from "lucide-react";
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
} from "@citybox/ui/atoms";
import { SearchInput } from "@citybox/ui/molecules";
import { DataTable, type ColumnDef } from "@citybox/ui/organisms";
import {
  ERP_DATA_TABLE_RESPONSIVE_SCROLL_CLASS,
  erpDataTableStyleProps,
} from "@/features/shared/lib/data-table-styles";
import { formatBrlCurrencyFromCents } from "@/features/clinic/modules/settings/plans/lib/format-brl-currency";
import { useDebouncedSearch } from "@/features/clinic/modules/patients/hooks/use-debounced-search";
import type {
  RevenueAnalysisDimension,
  RevenueAnalysisMode,
  RevenueDetailRow,
  RevenuePeriodFilter,
} from "../types/clinic-dashboard";
import { formatLocalDateBr } from "../lib/dashboard-dates";
import { useDashboardRevenueDetailsQuery } from "../hooks/use-dashboard-revenue-details-query";

const PAGE_SIZE = 20;

type DashboardRevenueDetailsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  titlePrefix: string;
  itemName: string;
  mode: RevenueAnalysisMode;
  dimension: RevenueAnalysisDimension;
  dimensionKey: string;
  period: RevenuePeriodFilter;
  startDate?: string;
  endDate?: string;
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

export function DashboardRevenueDetailsDialog({
  open,
  onOpenChange,
  titlePrefix,
  itemName,
  mode,
  dimension,
  dimensionKey,
  period,
  startDate,
  endDate,
}: DashboardRevenueDetailsDialogProps) {
  const [page, setPage] = useState(1);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { search, debouncedSearch, handleSearchChange, clearSearch } =
    useDebouncedSearch();

  useEffect(() => {
    setPage(1);
  }, [dimensionKey, mode, dimension, period, startDate, endDate, debouncedSearch]);

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardRevenueDetailsQuery(
      {
        mode,
        dimension,
        dimensionKey,
        period,
        startDate,
        endDate,
        page,
        perPage: PAGE_SIZE,
        search: debouncedSearch || undefined,
      },
      { enabled: open && Boolean(dimensionKey) },
    );

  const dateHeader = mode === "receipts" ? "Dt. Pagamento" : "Dt. Venda";
  const valueHeader = mode === "receipts" ? "Valor recebido" : "Valor da venda";

  const columns = useMemo<ColumnDef<RevenueDetailRow>[]>(
    () => [
      {
        accessorKey: "date",
        header: dateHeader,
        cell: ({ row }) => (
          <span className="whitespace-nowrap">
            {formatLocalDateBr(row.original.date)}
          </span>
        ),
      },
      {
        accessorKey: "patientName",
        header: "Paciente",
        cell: ({ row }) => (
          <Link
            href={`/pacientes/${row.original.patientId}/sobre`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            {row.original.patientName}
          </Link>
        ),
      },
      {
        accessorKey: "treatmentName",
        header: "Procedimento",
        cell: ({ row }) => (
          <span className="line-clamp-2 break-words">
            {row.original.treatmentName}
          </span>
        ),
      },
      {
        accessorKey: "valueCents",
        header: valueHeader,
        cell: ({ row }) => (
          <span className="block whitespace-nowrap text-right tabular-nums">
            {formatBrlCurrencyFromCents(row.original.valueCents)}
          </span>
        ),
      },
    ],
    [dateHeader, valueHeader],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsSearchOpen(false);
      clearSearch();
      setPage(1);
    }
    onOpenChange(nextOpen);
  };

  const canGoPrev = page > 1;
  const canGoNext = page < Math.max(meta.totalPages, 1);

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[min(90dvh,44rem)] w-[calc(100%-1.5rem)] max-w-4xl flex-col gap-0 p-0 sm:w-full sm:max-w-4xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <DialogTitle className="min-w-0 text-pretty">
              {titlePrefix}{" "}
              <span className="text-primary">{itemName}</span>
            </DialogTitle>
            {isSearchOpen ? (
              <div className="flex items-center gap-2">
                <SearchInput
                  autoFocus
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Buscar paciente…"
                  aria-label="Buscar paciente"
                  containerClassName="w-full max-w-56"
                  className="h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Fechar busca de paciente"
                  onClick={() => {
                    clearSearch();
                    setIsSearchOpen(false);
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
                aria-label="Abrir busca de paciente"
                onClick={() => setIsSearchOpen(true)}
              >
                <Search className="size-4" />
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            Detalhamento das receitas filtradas.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
          {isLoading ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Carregando detalhes…
            </p>
          ) : isError ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Não foi possível carregar os detalhes.
            </p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              Nenhum paciente encontrado.
            </p>
          ) : (
            <>
              <ul className="flex flex-col gap-3 lg:hidden">
                {items.map((detail) => (
                  <li key={detail.id}>
                    <Card className="min-w-0 py-0">
                      <CardContent className="space-y-3 p-4">
                        <div className="flex items-start justify-between gap-3">
                          <Link
                            href={`/pacientes/${detail.patientId}/sobre`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-w-0 break-words font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {detail.patientName}
                          </Link>
                          <span className="shrink-0 whitespace-nowrap text-sm font-semibold tabular-nums">
                            {formatBrlCurrencyFromCents(detail.valueCents)}
                          </span>
                        </div>
                        <dl className="grid grid-cols-1 gap-2">
                          <DetailField label={dateHeader}>
                            {formatLocalDateBr(detail.date)}
                          </DetailField>
                          <DetailField label="Procedimento">
                            {detail.treatmentName}
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
                      <col className="w-[41%]" />
                      <col className="w-[20%]" />
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
              ? `${meta.total} registro(s)${isFetching ? " · atualizando…" : ""}`
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
