"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  startOfToday,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  addDays,
  format,
} from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmDialog } from "@citybox/ui/organisms";

import { PatientDocumentPdfSheet } from "@/features/clinic/modules/patients/components/detail/documents/patient-document-pdf-sheet";
import { downloadPatientDocumentPdf } from "@/features/clinic/modules/patients/lib/patient-document-pdf-actions";
import { parseLocalDateString } from "@/features/clinic/agenda/lib/local-date";
import { formatPdfPeriodLabel } from "@/features/clinic/lib/format-pdf-period-label";
import { resolveClinicWeekRange } from "@/features/clinic/lib/resolve-clinic-week-range";
import { parseTransactionsDeepLink } from "@/features/clinic/modules/dashboard/lib/transactions-deep-link";
import { clinicSettingsKeys } from "@/features/clinic/modules/settings/hooks/query-keys";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import { useClinicId } from "@/features/clinic/estoque/lib/use-clinic-id";
import { useStore } from "@/lib/store-context";

import { CashFlowStats } from "../components/cash-flow-stats";
import { TransactionsHeader } from "../components/transactions-header";
import { TransactionsByMethodTable } from "../components/transactions-by-method-table";
import { TransactionsDetailTable } from "../components/transactions-detail-table";
import { FinancialReceivePaymentSheet } from "../components/receive-payment-sheet";
import { PayExpenseSheet } from "../components/pay-expense-sheet";
import { EmitIncomeReceiptDialog } from "../components/emit-income-receipt-dialog";
import { applyViewMethod } from "../lib/apply-view-method";
import { buildTransactionsApiParams } from "../lib/build-transactions-api-params";
import {
  buildTransactionsPdf,
  buildTransactionsPdfFileName,
} from "../lib/build-transactions-pdf";
import { toPdfClinicInfo } from "../lib/to-pdf-clinic-info";
import {
  useTransactionsByMethod,
  useTransactionsList,
  useTransactionsStats,
} from "../hooks/use-transactions-query";
import { useCancelPayment } from "../hooks/use-cancel-payment";
import { useDeleteFinancialEntry } from "../hooks/use-delete-financial-entry";
import { useEmitIncomeReceipt } from "../hooks/use-emit-income-receipt";
import { useFinancialPermissions } from "../hooks/use-financial-permissions";
import { financialService } from "../services/financial.service";
import type {
  CashFlowPeriodFilter,
  FinancialEntry,
  TransactionsFilters,
  TransactionsViewMode,
} from "../types";
import { EMPTY_TRANSACTIONS_FILTERS } from "../types";

function resolvePeriodDates(
  period: CashFlowPeriodFilter,
  customStart?: Date,
  customEnd?: Date,
): { startDate: string; endDate: string } {
  const today = startOfToday();
  switch (period) {
    case "today":
      return {
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
      };
    case "this_week":
      return resolveClinicWeekRange(today);
    case "this_month":
      return {
        startDate: format(startOfMonth(today), "yyyy-MM-dd"),
        endDate: format(endOfMonth(today), "yyyy-MM-dd"),
      };
    case "last_month": {
      const lm = subMonths(today, 1);
      return {
        startDate: format(startOfMonth(lm), "yyyy-MM-dd"),
        endDate: format(endOfMonth(lm), "yyyy-MM-dd"),
      };
    }
    case "last_30_days":
      return {
        startDate: format(subDays(today, 30), "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
      };
    case "next_30_days":
      return {
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(addDays(today, 30), "yyyy-MM-dd"),
      };
    case "custom":
      if (customStart && customEnd) {
        return {
          startDate: format(customStart, "yyyy-MM-dd"),
          endDate: format(customEnd, "yyyy-MM-dd"),
        };
      }
      return {
        startDate: format(today, "yyyy-MM-dd"),
        endDate: format(today, "yyyy-MM-dd"),
      };
    case "all":
    default:
      return {
        startDate: format(subDays(today, 365), "yyyy-MM-dd"),
        endDate: format(addDays(today, 365), "yyyy-MM-dd"),
      };
  }
}

const EMPTY_STATS = {
  income: { received: 0, toReceive: 0, total: 0 },
  expense: { paid: 0, toPay: 0, total: 0 },
  balance: { current: 0, projected: 0 },
};

/**
 * Transações — liquidados via clinica-api (`v1/financial/entries*`).
 * Recibo PDF client-side; anexar comprovante MinIO fora de escopo.
 */
export function ClinicTransactionsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkAppliedRef = useRef(false);
  const { storeId } = useStore();
  const { clinicId, isReady } = useClinicId();

  const [periodFilter, setPeriodFilter] =
    useState<CashFlowPeriodFilter>("this_month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<TransactionsFilters>(
    EMPTY_TRANSACTIONS_FILTERS,
  );
  const [viewMode, setViewMode] =
    useState<TransactionsViewMode>("payment_method");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [isExporting, setIsExporting] = useState(false);

  const { data: clinicProfile } = useQuery({
    queryKey: clinicSettingsKeys.profile(storeId ?? ""),
    queryFn: () => getClinicProfile(storeId!),
    enabled: Boolean(storeId),
  });

  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(
    null,
  );
  const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<FinancialEntry | null>(
    null,
  );
  const [entryToCancel, setEntryToCancel] = useState<FinancialEntry | null>(
    null,
  );

  const {
    openEmitReceipt,
    emitDialog,
    previewSheet,
  } = useEmitIncomeReceipt();

  // Deep-link do dashboard: ?types=income&paymentMethods=credit&view=transactions&period=…
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;

    const deepLink = parseTransactionsDeepLink(searchParams);
    if (!deepLink) return;

    deepLinkAppliedRef.current = true;
    setPeriodFilter(deepLink.period);
    if (deepLink.period === "custom") {
      setCustomStartDate(
        deepLink.startDate ? parseLocalDateString(deepLink.startDate) : undefined,
      );
      setCustomEndDate(
        deepLink.endDate ? parseLocalDateString(deepLink.endDate) : undefined,
      );
    } else {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
    setFilters({
      ...EMPTY_TRANSACTIONS_FILTERS,
      types: deepLink.filters.types,
      paymentMethods: deepLink.filters.paymentMethods,
    });
    setViewMode(deepLink.viewMode);
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const { startDate, endDate } = resolvePeriodDates(
    periodFilter,
    customStartDate,
    customEndDate,
  );

  const filterParams = { startDate, endDate, filters };

  useEffect(() => {
    setPage(1);
  }, [startDate, endDate, filters, viewMode]);

  const { data: methodRows = [], isLoading: isLoadingMethods } =
    useTransactionsByMethod(filterParams);
  const { data: listPage, isLoading: isLoadingEntries } = useTransactionsList({
    ...filterParams,
    page,
    perPage,
    enabled: viewMode === "transactions",
  });
  const { data: stats = EMPTY_STATS } = useTransactionsStats(filterParams);

  const entries = listPage?.entries ?? [];
  const total = listPage?.pagination.total ?? 0;
  const totalPages =
    listPage?.pagination.totalPages ??
    Math.ceil(total / (listPage?.pagination.limit ?? perPage)) ??
    0;

  const { mutate: deleteEntry } = useDeleteFinancialEntry();
  const { mutate: cancelPayment } = useCancelPayment();
  const { showStatsCards } = useFinancialPermissions();

  const handlePeriodChange = (period: CashFlowPeriodFilter) => {
    setPeriodFilter(period);
    if (period !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (isExporting || !isReady) return;
    setIsExporting(true);
    try {
      const periodLabel = formatPdfPeriodLabel(startDate, endDate);
      const clinic = toPdfClinicInfo(clinicProfile);

      if (viewMode === "payment_method") {
        const blob = await buildTransactionsPdf({
          mode: "payment_method",
          rows: methodRows,
          periodLabel,
          clinic,
        });
        downloadPatientDocumentPdf(
          blob,
          buildTransactionsPdfFileName("payment_method"),
        );
      } else {
        const apiParams = buildTransactionsApiParams({
          startDate,
          endDate,
          filters,
          page: 1,
          perPage: 100,
        });
        const firstPage = await financialService.entries.list(
          clinicId,
          apiParams,
        );
        let allEntries = firstPage.entries;
        const totalPages = Math.max(firstPage.pagination.totalPages, 1);
        for (let p = 2; p <= totalPages; p += 1) {
          const next = await financialService.entries.list(clinicId, {
            ...apiParams,
            page: p,
          });
          allEntries = [...allEntries, ...next.entries];
        }

        const blob = await buildTransactionsPdf({
          mode: "transactions",
          entries: allEntries,
          periodLabel,
          clinic,
        });
        downloadPatientDocumentPdf(
          blob,
          buildTransactionsPdfFileName("transactions"),
        );
      }

      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    } finally {
      setIsExporting(false);
    }
  }, [
    clinicId,
    clinicProfile,
    customEndDate,
    customStartDate,
    endDate,
    filters,
    isExporting,
    isReady,
    methodRows,
    periodFilter,
    startDate,
    viewMode,
  ]);

  const handleViewMethod = (method: string) => {
    const next = applyViewMethod(filters, method);
    setViewMode(next.viewMode);
    setFilters(next.filters);
  };

  const handleViewEntry = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    if (entry.type === "expense") {
      setIsPaySheetOpen(true);
    } else {
      setIsReceiveSheetOpen(true);
    }
  };

  const handleAttachReceipt = async (_file: File) => {
    toast.info("Anexar comprovante em breve");
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;
    deleteEntry(entryToDelete.id, {
      onSuccess: () => toast.success("Lançamento excluído"),
      onError: () => toast.error("Erro ao excluir lançamento"),
    });
    setEntryToDelete(null);
  };

  const confirmCancel = () => {
    if (!entryToCancel) return;
    const isIncome = entryToCancel.type === "income";
    cancelPayment(entryToCancel.id, {
      onSuccess: () =>
        toast.success(
          isIncome
            ? "Recebimento cancelado — lançamento voltou a pendente"
            : "Pagamento cancelado — lançamento voltou a pendente",
        ),
      onError: () =>
        toast.error(
          isIncome
            ? "Erro ao cancelar recebimento"
            : "Erro ao cancelar pagamento",
        ),
    });
    setEntryToCancel(null);
  };

  const cancelIsIncome = entryToCancel?.type === "income";

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:overflow-hidden md:gap-6">
      <div className="shrink-0 space-y-4 md:space-y-6">
      <TransactionsHeader
        period={periodFilter}
        startDate={customStartDate}
        endDate={customEndDate}
        onPeriodChange={handlePeriodChange}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
        filters={filters}
        onFiltersChange={setFilters}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onExport={handleExportPdf}
        isExporting={isExporting}
      />

      {showStatsCards ? (
        <CashFlowStats
          income={stats.income}
          expense={stats.expense}
          balance={{
            current: stats.balance.current,
            projected: stats.balance.projected,
          }}
        />
      ) : null}
      </div>

      {viewMode === "payment_method" ? (
        <TransactionsByMethodTable
          rows={isLoadingMethods ? [] : methodRows}
          onView={handleViewMethod}
        />
      ) : (
        <TransactionsDetailTable
          className="md:min-h-0 md:flex-1"
          entries={isLoadingEntries ? [] : entries}
          total={total}
          page={page}
          perPage={perPage}
          totalPages={totalPages || 1}
          onPageChange={setPage}
          onPerPageChange={(size) => {
            setPerPage(size);
            setPage(1);
          }}
          onView={handleViewEntry}
          onDelete={setEntryToDelete}
          onCancelPayment={setEntryToCancel}
          onEmitReceipt={openEmitReceipt}
        />
      )}

      <FinancialReceivePaymentSheet
        open={isReceiveSheetOpen}
        onOpenChange={(open) => {
          setIsReceiveSheetOpen(open);
          if (!open) setSelectedEntry(null);
        }}
        entry={selectedEntry?.type === "income" ? selectedEntry : null}
        viewMode
        onAttachReceipt={handleAttachReceipt}
      />

      <PayExpenseSheet
        open={isPaySheetOpen}
        onOpenChange={(open) => {
          setIsPaySheetOpen(open);
          if (!open) setSelectedEntry(null);
        }}
        entry={selectedEntry?.type === "expense" ? selectedEntry : null}
        viewMode
        onAttachReceipt={handleAttachReceipt}
      />

      <EmitIncomeReceiptDialog {...emitDialog} />

      <PatientDocumentPdfSheet {...previewSheet} />

      <ConfirmDialog
        open={!!entryToCancel}
        onOpenChange={(open) => !open && setEntryToCancel(null)}
        onConfirm={confirmCancel}
        title={
          cancelIsIncome ? "Cancelar recebimento?" : "Cancelar pagamento?"
        }
        description={`O lançamento "${entryToCancel?.description ?? ""}" voltará para status pendente (ou vencido, se a data de vencimento já passou). Você poderá pagar/receber novamente.`}
        confirmVariant="destructive"
        confirmLabel={
          cancelIsIncome ? "Cancelar recebimento" : "Cancelar pagamento"
        }
        cancelLabel="Voltar"
      />

      <ConfirmDialog
        open={!!entryToDelete}
        onOpenChange={(open) => !open && setEntryToDelete(null)}
        onConfirm={confirmDelete}
        title="Excluir lançamento?"
        description={`O lançamento "${entryToDelete?.description ?? ""}" será excluído permanentemente. Esta ação não pode ser desfeita.`}
        confirmVariant="destructive"
        confirmLabel="Excluir"
      />
    </div>
  );
}
