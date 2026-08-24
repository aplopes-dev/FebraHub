"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Download } from "lucide-react";
import { toast } from "sonner";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Separator,
} from "@citybox/ui/atoms";
import { DataTable, type ColumnDef } from "@citybox/ui/organisms";
import { erpDataTableStyleProps } from "@/features/shared/lib/data-table-styles";
import { downloadPatientDocumentPdf } from "@/features/clinic/modules/patients/lib/patient-document-pdf-actions";
import { formatBrlCurrencyFromCents } from "@/features/clinic/modules/settings/plans/lib/format-brl-currency";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import type { DashboardBudgetRow } from "../types/clinic-dashboard";
import {
  buildDashboardBudgetsPdf,
  buildDashboardBudgetsPdfFileName,
  mapClinicSettingsToDashboardPdfClinic,
} from "../lib/build-dashboard-budgets-pdf";
import { formatLocalDateBr } from "../lib/dashboard-dates";
import {
  DASHBOARD_BUDGET_STATUS_BADGE_CLASS,
  DASHBOARD_BUDGET_STATUS_LABEL,
} from "../lib/dashboard-budget-ui";
import { useDashboardBudgetsQuery } from "../hooks/use-dashboard-budgets-query";
import { fetchDashboardBudgets } from "../services/dashboard.api.service";

const PAGE_SIZE = 20;

type DashboardBudgetsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DashboardBudgetsDialog({
  open,
  onOpenChange,
}: DashboardBudgetsDialogProps) {
  const { clinicId } = useClinicId();
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  const { items, meta, isLoading, isError, isFetching } =
    useDashboardBudgetsQuery(
      { page, perPage: PAGE_SIZE },
      { enabled: open },
    );

  const columns = useMemo<ColumnDef<DashboardBudgetRow>[]>(
    () => [
      {
        accessorKey: "budgetDate",
        header: "Data do orçamento",
        cell: ({ row }) => formatLocalDateBr(row.original.budgetDate),
      },
      {
        accessorKey: "patientName",
        header: "Paciente",
      },
      {
        accessorKey: "description",
        header: "Descrição",
        cell: ({ row }) => (
          <span className="block whitespace-normal wrap-break-word">
            {row.original.description}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={DASHBOARD_BUDGET_STATUS_BADGE_CLASS[row.original.status]}
          >
            {DASHBOARD_BUDGET_STATUS_LABEL[row.original.status]}
          </Badge>
        ),
      },
      {
        accessorKey: "valueCents",
        header: "Valor",
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">
            {formatBrlCurrencyFromCents(row.original.valueCents)}
          </span>
        ),
      },
    ],
    [],
  );

  const handleExport = async () => {
    if (!clinicId) return;
    setIsExporting(true);
    try {
      const allBudgets: DashboardBudgetRow[] = [];
      let currentPage = 1;
      let totalPages = 1;

      do {
        const result = await fetchDashboardBudgets(clinicId, {
          page: currentPage,
          perPage: 100,
        });
        allBudgets.push(...result.items);
        totalPages = Math.max(result.meta.totalPages, 1);
        currentPage += 1;
      } while (currentPage <= totalPages);

      const clinicProfile = await getClinicProfile(clinicId);
      const blob = await buildDashboardBudgetsPdf({
        budgets: allBudgets,
        clinic: mapClinicSettingsToDashboardPdfClinic(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildDashboardBudgetsPdfFileName());
      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    } finally {
      setIsExporting(false);
    }
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
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
        className="flex max-h-[min(90dvh,44rem)] w-full max-w-5xl flex-col gap-0 p-0 sm:max-w-5xl"
      >
        <DialogHeader className="shrink-0 space-y-0 px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>Orçamentos em aberto e reprovados</DialogTitle>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isExporting || isLoading || meta.total === 0}
              onClick={() => void handleExport()}
            >
              <Download className="size-4" />
              Exportar
            </Button>
          </div>
          <DialogDescription className="sr-only">
            Lista de orçamentos em aberto e reprovados da clínica.
          </DialogDescription>
        </DialogHeader>

        <Separator className="shrink-0" />

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
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
              Nenhum orçamento em aberto ou reprovado.
            </p>
          ) : (
            <>
              <DataTable
                columns={columns}
                data={items}
                manualPagination
                pageIndex={page - 1}
                pageCount={Math.max(meta.totalPages, 1)}
                totalRowCount={meta.total}
                pageSize={PAGE_SIZE}
                colgroup={
                  <colgroup>
                    <col style={{ width: "16%" }} />
                    <col style={{ width: "20%" }} />
                    {/* Descrição concentra o texto longo — recebe a maior fatia. */}
                    <col style={{ width: "40%" }} />
                    <col style={{ width: "12%" }} />
                    <col style={{ width: "12%" }} />
                  </colgroup>
                }
                {...erpDataTableStyleProps}
                paginationClassName="hidden"
              />
              <div className="mt-3 flex justify-end border-t border-border/60 pt-3">
                <p className="min-w-32 pr-3 text-right text-sm font-semibold tabular-nums">
                  {`Total ${formatBrlCurrencyFromCents(meta.totalValueCents)}`}
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="shrink-0 flex-col gap-3 border-t px-6 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {!isLoading && !isError
              ? `${meta.total} orçamento(s)${isFetching ? " · atualizando…" : ""}`
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
