"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  startOfToday,
  startOfMonth,
  endOfMonth,
  subMonths,
  subDays,
  addDays,
  format,
} from "date-fns";
import { resolveClinicWeekRange } from "@/features/clinic/lib/resolve-clinic-week-range";
import { toast } from "sonner";

import { ConfirmDialog } from "@citybox/ui/organisms";

import { parseLocalDateString } from "@/features/clinic/agenda/lib/local-date";
import { parseCashFlowDeepLink } from "@/features/clinic/modules/dashboard/lib/cash-flow-deep-link";
import { PatientDocumentPdfSheet } from "@/features/clinic/modules/patients/components/detail/documents/patient-document-pdf-sheet";
import { downloadPatientDocumentPdf } from "@/features/clinic/modules/patients/lib/patient-document-pdf-actions";
import { clinicSettingsKeys } from "@/features/clinic/modules/settings/hooks/query-keys";
import { getClinicProfile } from "@/features/clinic/modules/settings/services/clinic-profile.service";
import { useStore } from "@/lib/store-context";
import { CashFlowHeader } from "../components/cash-flow-header";
import { CashFlowStats } from "../components/cash-flow-stats";
import { CashFlowTable } from "../components/cash-flow-table";
import { EmitIncomeReceiptDialog } from "../components/emit-income-receipt-dialog";
import { NewExpenseSheet } from "../components/new-expense-sheet";
import { NewIncomeSheet } from "../components/new-income-sheet";
import { PayExpenseSheet } from "../components/pay-expense-sheet";
import { FinancialReceivePaymentSheet } from "../components/receive-payment-sheet";
import { RecurrenceScopeDialog } from "../components/recurrence-scope-dialog";
import type { RecurrenceScope } from "../hooks/use-update-recurrence-group";
import { useFinancialEntries } from "../hooks/use-financial-entries";
import { useFinancialStats } from "../hooks/use-financial-stats";
import { useCancelPayment } from "../hooks/use-cancel-payment";
import { useDeleteFinancialEntry } from "../hooks/use-delete-financial-entry";
import { useEmitIncomeReceipt } from "../hooks/use-emit-income-receipt";
import { useFinancialPermissions } from "../hooks/use-financial-permissions";
import {
  buildCashFlowPdf,
  buildCashFlowPdfFileName,
  formatCashFlowPdfPeriodLabel,
} from "../lib/build-cash-flow-pdf";
import { canReceiveIncomeEntry } from "../lib/can-receive-income-entry";
import { resolveListTypesParam, type FinancialEntryTypeName } from "../lib/resolve-allowed-entry-types";
import { toPdfClinicInfo } from "../lib/to-pdf-clinic-info";
import type { CashFlowPeriodFilter, CashFlowFilters, FinancialEntry } from "../types";

function resolvePeriodDates(
  period: CashFlowPeriodFilter,
  customStart?: Date,
  customEnd?: Date
): { startDate: string; endDate: string } {
  const today = startOfToday();
  switch (period) {
    case "today":
      return { startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    case "this_week":
      return resolveClinicWeekRange(today);
    case "this_month":
      return { startDate: format(startOfMonth(today), "yyyy-MM-dd"), endDate: format(endOfMonth(today), "yyyy-MM-dd") };
    case "last_month": {
      const lm = subMonths(today, 1);
      return { startDate: format(startOfMonth(lm), "yyyy-MM-dd"), endDate: format(endOfMonth(lm), "yyyy-MM-dd") };
    }
    case "last_30_days":
      return { startDate: format(subDays(today, 30), "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    case "next_30_days":
      return { startDate: format(today, "yyyy-MM-dd"), endDate: format(addDays(today, 30), "yyyy-MM-dd") };
    case "custom":
      if (customStart && customEnd) {
        return { startDate: format(customStart, "yyyy-MM-dd"), endDate: format(customEnd, "yyyy-MM-dd") };
      }
      return { startDate: format(today, "yyyy-MM-dd"), endDate: format(today, "yyyy-MM-dd") };
    case "all":
    default:
      return {
        startDate: format(subDays(today, 365), "yyyy-MM-dd"),
        endDate: format(addDays(today, 365), "yyyy-MM-dd"),
      };
  }
}

function mapFiltersToApiParams(
  filters: CashFlowFilters,
  allowedTypes: FinancialEntryTypeName[],
) {
  const apiStatuses: string[] = [];
  if (filters.statuses.includes("paid")) apiStatuses.push("paid", "received");
  if (filters.statuses.includes("unpaid")) apiStatuses.push("pending");

  return {
    types: resolveListTypesParam(filters.types, allowedTypes),
    statuses: apiStatuses.length > 0 ? apiStatuses.join(",") : undefined,
    hasReceipt: filters.hasReceipt !== "all" ? filters.hasReceipt === "with" : undefined,
    accountIds: filters.cashRegisters.length > 0 ? filters.cashRegisters.join(",") : undefined,
    paymentMethods: filters.paymentMethods.length > 0 ? filters.paymentMethods.join(",") : undefined,
    categoryIds: filters.categories.length > 0 ? filters.categories.join(",") : undefined,
  };
}

const EMPTY_STATS = {
  income: { received: 0, toReceive: 0, total: 0 },
  expense: { paid: 0, toPay: 0, total: 0 },
  balance: { current: 0, projected: 0 },
};

function computeStatsFromEntries(entries: FinancialEntry[]) {
  let incomeReceived = 0;
  let incomeToReceive = 0;
  let expensePaid = 0;
  let expenseToPay = 0;

  for (const e of entries) {
    if (e.status === "cancelled") continue;
    if (e.type === "income") {
      if (e.status === "received") incomeReceived += e.value;
      else incomeToReceive += e.value;
    } else {
      if (e.status === "paid") expensePaid += e.value;
      else expenseToPay += e.value;
    }
  }

  return {
    income: { received: incomeReceived, toReceive: incomeToReceive, total: incomeReceived + incomeToReceive },
    expense: { paid: expensePaid, toPay: expenseToPay, total: expensePaid + expenseToPay },
    balance: {
      current: incomeReceived - expensePaid,
      projected: incomeReceived + incomeToReceive - (expensePaid + expenseToPay),
    },
  };
}

const EMPTY_CASH_FLOW_FILTERS: CashFlowFilters = {
  types: [],
  statuses: [],
  hasReceipt: "all",
  cashRegisters: [],
  paymentMethods: [],
  categories: [],
};

export function ClinicCashFlowPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkAppliedRef = useRef(false);
  const { storeId } = useStore();

  const [periodFilter, setPeriodFilter] = useState<CashFlowPeriodFilter>("this_month");
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);
  const [filters, setFilters] = useState<CashFlowFilters>(EMPTY_CASH_FLOW_FILTERS);
  const [isExporting, setIsExporting] = useState(false);

  const { data: clinicProfile } = useQuery({
    queryKey: clinicSettingsKeys.profile(storeId ?? ""),
    queryFn: () => getClinicProfile(storeId!),
    enabled: Boolean(storeId),
  });

  // Deep-link do dashboard: ?types=expense&categories=…&period=custom&startDate&endDate
  useEffect(() => {
    if (deepLinkAppliedRef.current) return;

    const deepLink = parseCashFlowDeepLink(searchParams);
    if (!deepLink) return;

    deepLinkAppliedRef.current = true;
    setPeriodFilter(deepLink.period);
    setCustomStartDate(parseLocalDateString(deepLink.startDate));
    setCustomEndDate(parseLocalDateString(deepLink.endDate));
    setFilters({
      ...EMPTY_CASH_FLOW_FILTERS,
      types: deepLink.filters.types,
      statuses: deepLink.filters.statuses,
      categories: deepLink.filters.categories,
    });
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const {
    canSettleIncome,
    canSettleExpense,
    canSettleFuture,
    canSettleRetroactive,
    canUpdateIncome,
    canUpdateExpense,
    canDeleteIncome,
    canDeleteExpense,
    allowedEntryTypes,
    showIncomeStats,
    showExpenseStats,
    showBalanceStats,
    showStatsCards,
    canSummary,
  } = useFinancialPermissions();

  const canReceiveFlags = {
    canSettleIncome,
    canSettleFuture,
    canSettleRetroactive,
  };
  const hasAnyReceivePermission =
    canSettleIncome || canSettleFuture || canSettleRetroactive;

  const { startDate, endDate } = resolvePeriodDates(periodFilter, customStartDate, customEndDate);
  const apiFilterParams = mapFiltersToApiParams(filters, allowedEntryTypes);

  const hasActiveFilters = Object.values(apiFilterParams).some((v) => v !== undefined);
  /** Sem resumo, stats da API (exige `read Financial`) não estão disponíveis. */
  const mustComputeLocalStats = hasActiveFilters || !canSummary;

  const { data: entriesData, isLoading: isLoadingEntries } = useFinancialEntries({
    startDate,
    endDate,
    perPage: 100,
    page: 1,
    ...apiFilterParams,
  });

  const { data: statsData } = useFinancialStats(
    { startDate, endDate },
    { enabled: canSummary },
  );

  const entries = entriesData?.entries ?? [];

  // Stats da API cobrem o período; com filtros / sem resumo, recalcula sobre a página carregada.
  const stats = mustComputeLocalStats
    ? computeStatsFromEntries(entries)
    : (statsData ?? EMPTY_STATS);

  const { mutate: cancelPayment } = useCancelPayment();
  const { mutate: deleteEntry } = useDeleteFinancialEntry();
  const {
    openEmitReceipt,
    emitDialog,
    previewSheet,
  } = useEmitIncomeReceipt();

  const [isNewExpenseOpen, setIsNewExpenseOpen] = useState(false);
  const [isNewIncomeOpen, setIsNewIncomeOpen] = useState(false);
  const [entryToEdit, setEntryToEdit] = useState<FinancialEntry | null>(null);
  const [editScope, setEditScope] = useState<RecurrenceScope>("this");
  const [isScopeDialogOpen, setIsScopeDialogOpen] = useState(false);

  const [selectedEntry, setSelectedEntry] = useState<FinancialEntry | null>(null);
  const [isReceiveSheetOpen, setIsReceiveSheetOpen] = useState(false);
  const [isViewPaymentMode, setIsViewPaymentMode] = useState(false);
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [isViewPayExpenseMode, setIsViewPayExpenseMode] = useState(false);

  const [entryToDelete, setEntryToDelete] = useState<FinancialEntry | null>(null);
  const [entryToCancel, setEntryToCancel] = useState<FinancialEntry | null>(null);

  const handlePeriodChange = (period: CashFlowPeriodFilter) => {
    setPeriodFilter(period);
    if (period !== "custom") {
      setCustomStartDate(undefined);
      setCustomEndDate(undefined);
    }
  };

  const handleExportPdf = useCallback(async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      const blob = await buildCashFlowPdf({
        entries,
        periodLabel: formatCashFlowPdfPeriodLabel(startDate, endDate),
        clinic: toPdfClinicInfo(clinicProfile),
      });
      downloadPatientDocumentPdf(blob, buildCashFlowPdfFileName());
      toast.success("PDF exportado");
    } catch {
      toast.error("Não foi possível exportar o PDF");
    } finally {
      setIsExporting(false);
    }
  }, [
    clinicProfile,
    endDate,
    entries,
    isExporting,
    startDate,
  ]);

  const handleReceive = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsViewPaymentMode(false);
    setIsReceiveSheetOpen(true);
  };

  const handlePay = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    setIsViewPayExpenseMode(false);
    setIsPaySheetOpen(true);
  };

  const handleViewPayment = (entry: FinancialEntry) => {
    setSelectedEntry(entry);
    if (entry.type === "expense") {
      setIsViewPayExpenseMode(true);
      setIsPaySheetOpen(true);
    } else {
      setIsViewPaymentMode(true);
      setIsReceiveSheetOpen(true);
    }
  };

  const handleCancelPayment = (entry: FinancialEntry) => {
    setEntryToCancel(entry);
  };

  const handleDelete = (entry: FinancialEntry) => {
    setEntryToDelete(entry);
  };

  const openEditSheet = (entry: FinancialEntry, scope: RecurrenceScope) => {
    setEntryToEdit(entry);
    setEditScope(scope);
    if (entry.type === "expense") {
      setIsNewExpenseOpen(true);
    } else {
      setIsNewIncomeOpen(true);
    }
  };

  const handleEdit = (entry: FinancialEntry) => {
    const isRecurrent = !!entry.recurrenceGroupId && (entry.totalInstallments ?? 0) > 1;
    if (isRecurrent && entry.status === "pending") {
      setEntryToEdit(entry);
      setIsScopeDialogOpen(true);
    } else {
      openEditSheet(entry, "this");
    }
  };

  const confirmCancel = () => {
    if (!entryToCancel) return;
    cancelPayment(entryToCancel.id, {
      onSuccess: () =>
        toast.success("Pagamento cancelado — lançamento voltou a pendente"),
      onError: () => toast.error("Erro ao cancelar pagamento"),
    });
    setEntryToCancel(null);
  };

  const confirmDelete = () => {
    if (!entryToDelete) return;
    deleteEntry(entryToDelete.id, {
      onSuccess: () => toast.success("Lançamento excluído"),
      onError: () => toast.error("Erro ao excluir lançamento"),
    });
    setEntryToDelete(null);
  };

  return (
    <div className="flex flex-col gap-4 md:min-h-0 md:flex-1 md:overflow-hidden md:gap-6">
      <div className="shrink-0 space-y-4 md:space-y-6">
      <CashFlowHeader
        period={periodFilter}
        startDate={customStartDate}
        endDate={customEndDate}
        onPeriodChange={handlePeriodChange}
        onStartDateChange={setCustomStartDate}
        onEndDateChange={setCustomEndDate}
        filters={filters}
        onFiltersChange={setFilters}
        onAddExpense={() => setIsNewExpenseOpen(true)}
        onAddIncome={() => setIsNewIncomeOpen(true)}
        onExport={handleExportPdf}
        isExporting={isExporting}
      />

      {showStatsCards ? (
        <CashFlowStats
          income={stats.income}
          expense={stats.expense}
          balance={{ current: stats.balance.current, projected: stats.balance.projected }}
          showIncome={showIncomeStats}
          showExpense={showExpenseStats}
          showBalance={showBalanceStats}
        />
      ) : null}
      </div>

      <CashFlowTable
        className="md:min-h-0 md:flex-1"
        entries={isLoadingEntries ? [] : entries}
        onPay={canSettleExpense ? handlePay : undefined}
        onReceive={hasAnyReceivePermission ? handleReceive : undefined}
        canReceiveEntry={(entry) =>
          entry.type === "income" &&
          canReceiveIncomeEntry(canReceiveFlags, entry.dueDate)
        }
        onEdit={
          canUpdateIncome || canUpdateExpense
            ? (entry) => {
                if (entry.type === "income" && !canUpdateIncome) return;
                if (entry.type === "expense" && !canUpdateExpense) return;
                handleEdit(entry);
              }
            : undefined
        }
        onDelete={
          canDeleteIncome || canDeleteExpense
            ? (entry) => {
                if (entry.type === "income" && !canDeleteIncome) return;
                if (entry.type === "expense" && !canDeleteExpense) return;
                handleDelete(entry);
              }
            : undefined
        }
        onViewPayment={handleViewPayment}
        onEmitReceipt={openEmitReceipt}
        onCancelPayment={
          canSettleIncome || canSettleExpense ? handleCancelPayment : undefined
        }
      />

      <EmitIncomeReceiptDialog {...emitDialog} />

      <PatientDocumentPdfSheet {...previewSheet} />

      <RecurrenceScopeDialog
        open={isScopeDialogOpen}
        onOpenChange={setIsScopeDialogOpen}
        onConfirm={(scope) => {
          if (entryToEdit) openEditSheet(entryToEdit, scope);
        }}
      />

      <NewExpenseSheet
        open={isNewExpenseOpen}
        onOpenChange={(open) => {
          setIsNewExpenseOpen(open);
          if (!open) setEntryToEdit(null);
        }}
        entry={entryToEdit?.type === "expense" ? entryToEdit : null}
        editScope={entryToEdit?.type === "expense" ? editScope : undefined}
      />
      <NewIncomeSheet
        open={isNewIncomeOpen}
        onOpenChange={(open) => {
          setIsNewIncomeOpen(open);
          if (!open) setEntryToEdit(null);
        }}
        entry={entryToEdit?.type === "income" ? entryToEdit : null}
      />

      <FinancialReceivePaymentSheet
        open={isReceiveSheetOpen}
        onOpenChange={(open) => {
          setIsReceiveSheetOpen(open);
          if (!open) {
            setIsViewPaymentMode(false);
            setSelectedEntry(null);
          }
        }}
        entry={selectedEntry}
        viewMode={isViewPaymentMode}
      />

      <PayExpenseSheet
        open={isPaySheetOpen}
        onOpenChange={(open) => {
          setIsPaySheetOpen(open);
          if (!open) {
            setSelectedEntry(null);
            setIsViewPayExpenseMode(false);
          }
        }}
        entry={selectedEntry}
        viewMode={isViewPayExpenseMode}
      />

      <ConfirmDialog
        open={!!entryToCancel}
        onOpenChange={(open) => !open && setEntryToCancel(null)}
        onConfirm={confirmCancel}
        title="Cancelar pagamento?"
        description={`O lançamento "${entryToCancel?.description ?? ""}" voltará para status pendente (ou vencido, se a data de vencimento já passou). Você poderá pagar/receber novamente.`}
        confirmVariant="destructive"
        confirmLabel="Cancelar pagamento"
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
