'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@citybox/ui/atoms';
import { ConfirmDialog } from '@citybox/ui/organisms';
import { useDebouncedSearch } from '../../../hooks/use-debounced-search';
import {
  getPatientFinancialEntryMutationErrorMessage,
  usePatientFinancialEntriesQuery,
  usePatientFinancialEntryMutations,
} from '../../../hooks/use-patient-financial-entries-queries';
import { canEditPatientFinancialEntry } from '../../../lib/map-patient-financial-entry-to-debit-form';
import {
  resolvePeriodDateRange,
  type PatientFinancialPeriod,
} from '../../../lib/patient-financial-period';
import { patientDetailTabHref } from '../../../lib/patient-detail-tabs';
import {
  toApiFinancialSort,
  type PatientFinancialSort,
} from '../../../lib/sort-patient-financial-entries';
import type { PatientFinancialEntry } from '../../../types/patient-financial-entry';
import type { PatientFinancialEntryListMeta } from '../../../types/patient-financial-entry-api';
import type { PatientFinancialDebitFormValues } from '../../../types/patient-financial-debit-form';
import type { PatientFinancialReceiveFormValues } from '../../../types/patient-financial-receive-form';
import type { PatientFinancialAction } from '../financial/patient-financial-actions-menu';
import { PatientFinancialDebitSheet } from '../financial/patient-financial-debit-sheet';
import { PatientFinancialReceiveSheet } from '../financial/patient-financial-receive-sheet';
import { PatientFinancialPeriodFilter } from '../financial/patient-financial-period-filter';
import { PatientFinancialSummaryBar } from '../financial/patient-financial-summary-bar';
import { PatientFinancialTable } from '../financial/patient-financial-table';
import { PatientFinancialToolbar } from '../financial/patient-financial-toolbar';
import {
  PATIENT_FINANCIAL_PAGE_SIZE_OPTIONS,
  type PatientFinancialPageSize,
} from '../financial/patient-financial-pagination-bar';

type PatientFinancialTabProps = {
  patientId: string;
  patientName: string;
};

const DEFAULT_PAGE_SIZE: PatientFinancialPageSize = PATIENT_FINANCIAL_PAGE_SIZE_OPTIONS[1];

const DEFAULT_META: PatientFinancialEntryListMeta = {
  total: 0,
  page: 1,
  perPage: DEFAULT_PAGE_SIZE,
  totalPages: 0,
  totals: { receivedCents: 0, pendingCents: 0 },
};

export function PatientFinancialTab({ patientId, patientName }: PatientFinancialTabProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const budgetItemIdFilter = searchParams.get('budgetItemId')?.trim() || null;

  const { search, debouncedSearch, handleSearchChange } = useDebouncedSearch();
  const [showReceived, setShowReceived] = useState(true);
  const [period, setPeriod] = useState<PatientFinancialPeriod>('all');
  const [customStartDate, setCustomStartDate] = useState<string | null>(null);
  const [customEndDate, setCustomEndDate] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<PatientFinancialPageSize>(DEFAULT_PAGE_SIZE);
  const [sort, setSort] = useState<PatientFinancialSort | null>(null);
  const [debitSheetOpen, setDebitSheetOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<PatientFinancialEntry | null>(null);
  const [receivingEntry, setReceivingEntry] = useState<PatientFinancialEntry | null>(null);
  const [receiveSheetOpen, setReceiveSheetOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<PatientFinancialEntry | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const {
    createMutation,
    updateMutation,
    deleteMutation,
    deleteAttachmentMutation,
    receiveMutation,
    buildAttachmentDownloadUrl,
  } = usePatientFinancialEntryMutations(patientId);

  const periodRange = useMemo(
    () => resolvePeriodDateRange(period, customStartDate, customEndDate),
    [period, customStartDate, customEndDate],
  );

  const listParams = useMemo(
    () => ({
      page,
      perPage: pageSize,
      search: debouncedSearch,
      ...(showReceived ? {} : { status: 'pending' as const }),
      ...(periodRange
        ? { periodFrom: periodRange.start, periodTo: periodRange.end }
        : {}),
      ...(budgetItemIdFilter ? { budgetItemId: budgetItemIdFilter } : {}),
      ...toApiFinancialSort(sort),
    }),
    [
      budgetItemIdFilter,
      debouncedSearch,
      page,
      pageSize,
      periodRange,
      showReceived,
      sort,
    ],
  );

  const entriesQuery = usePatientFinancialEntriesQuery(patientId, listParams);

  const meta = entriesQuery.data?.meta ?? DEFAULT_META;
  const entries = entriesQuery.data?.items ?? [];
  const totals = meta.totals;

  useEffect(() => {
    setPage(1);
  }, [
    budgetItemIdFilter,
    debouncedSearch,
    period,
    customStartDate,
    customEndDate,
    showReceived,
    pageSize,
  ]);

  const handleClearBudgetItemFilter = useCallback(() => {
    router.replace(patientDetailTabHref(patientId, 'financeiro'));
  }, [patientId, router]);

  const emptyMessage = showReceived
    ? 'Nenhum lançamento encontrado para o período selecionado.'
    : 'Nenhum lançamento pendente para o período selecionado.';

  const handleShowReceivedChange = useCallback((nextShowReceived: boolean) => {
    setShowReceived(nextShowReceived);
  }, []);

  const handlePeriodChange = useCallback((nextPeriod: PatientFinancialPeriod) => {
    setPeriod(nextPeriod);
    if (nextPeriod !== 'custom') {
      setCustomStartDate(null);
      setCustomEndDate(null);
    }
  }, []);

  const handleNewDebit = useCallback(() => {
    setEditingEntry(null);
    setDebitSheetOpen(true);
  }, []);

  const handleReceive = useCallback((entry: PatientFinancialEntry) => {
    if (entry.status !== 'pending') {
      return;
    }

    setReceivingEntry(entry);
    setReceiveSheetOpen(true);
  }, []);

  const handleEntryAction = useCallback(
    (entry: PatientFinancialEntry, action: PatientFinancialAction) => {
      switch (action) {
        case 'edit':
          if (!canEditPatientFinancialEntry(entry)) {
            toast.info('Somente débitos pendentes podem ser editados.');
            return;
          }
          setEditingEntry(entry);
          setDebitSheetOpen(true);
          return;
        case 'delete':
          setEntryToDelete(entry);
          return;
        default:
          return;
      }
    },
    [],
  );

  const handleSubmitDebit = useCallback(
    async (values: PatientFinancialDebitFormValues, isEditing: boolean, entryId?: string) => {
      try {
        if (isEditing && entryId) {
          await updateMutation.mutateAsync({ entryId, values });
          toast.success('Débito atualizado com sucesso.');
          return;
        }

        await createMutation.mutateAsync(values);
        toast.success('Débito salvo com sucesso.');
      } catch (error) {
        toast.error(getPatientFinancialEntryMutationErrorMessage(error));
        throw error;
      }
    },
    [createMutation, updateMutation],
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!entryToDelete) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteMutation.mutateAsync(entryToDelete.id);
      toast.success('Lançamento excluído.');
      setEntryToDelete(null);
    } catch (error) {
      toast.error(getPatientFinancialEntryMutationErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  }, [deleteMutation, entryToDelete]);

  const handleRemoveSavedAttachment = useCallback(
    async (entryId: string, attachmentId: string) => {
      try {
        const entry = await deleteAttachmentMutation.mutateAsync({
          entryId,
          attachmentId,
        });
        setEditingEntry(entry);
        toast.success('Anexo removido.');
        return entry.debitDetail?.attachments ?? [];
      } catch (error) {
        toast.error(getPatientFinancialEntryMutationErrorMessage(error));
        throw error;
      }
    },
    [deleteAttachmentMutation],
  );

  const handleDownloadSavedAttachment = useCallback(
    (entryId: string, attachment: { id: string; name: string }) => {
      const url = buildAttachmentDownloadUrl(entryId, attachment.id);
      if (!url) {
        toast.error('Não foi possível baixar o anexo.');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    },
    [buildAttachmentDownloadUrl],
  );

  const handleDebitSheetOpenChange = useCallback((open: boolean) => {
    setDebitSheetOpen(open);
    if (!open) {
      setEditingEntry(null);
    }
  }, []);

  const handleReceiveSheetOpenChange = useCallback((open: boolean) => {
    setReceiveSheetOpen(open);
    if (!open) {
      setReceivingEntry(null);
    }
  }, []);

  const handleConfirmReceive = useCallback(
    async (entryId: string, values: PatientFinancialReceiveFormValues) => {
      try {
        await receiveMutation.mutateAsync({ entryId, values });
        toast.success('Recebimento registrado com sucesso.');
      } catch (error) {
        toast.error(getPatientFinancialEntryMutationErrorMessage(error));
        throw error;
      }
    },
    [receiveMutation],
  );

  return (
    <>
      <div className="space-y-4 rounded-2xl border border-border/50 bg-card p-4">
        {budgetItemIdFilter ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-muted/40 px-3 py-2">
            <p className="text-sm text-foreground">
              Filtrado pelo procedimento selecionado no prontuário.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleClearBudgetItemFilter}
            >
              Limpar filtro
            </Button>
          </div>
        ) : null}

        <PatientFinancialSummaryBar
          showReceived={showReceived}
          totals={totals}
          onShowReceivedChange={handleShowReceivedChange}
          onNewDebit={handleNewDebit}
        />

        <PatientFinancialToolbar search={search} onSearchChange={handleSearchChange} />

        <PatientFinancialPeriodFilter
          period={period}
          customStartDate={customStartDate}
          customEndDate={customEndDate}
          onPeriodChange={handlePeriodChange}
          onCustomStartDateChange={setCustomStartDate}
          onCustomEndDateChange={setCustomEndDate}
        />

        <PatientFinancialTable
          entries={entries}
          meta={meta}
          page={page}
          pageSize={pageSize}
          sort={sort}
          isLoading={entriesQuery.isLoading}
          emptyMessage={emptyMessage}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          onSortChange={setSort}
          onReceive={handleReceive}
          onEntryAction={handleEntryAction}
        />
      </div>

      <PatientFinancialDebitSheet
        open={debitSheetOpen}
        onOpenChange={handleDebitSheetOpenChange}
        patientId={patientId}
        patientName={patientName}
        editingEntry={editingEntry}
        onSubmit={handleSubmitDebit}
        onRemoveSavedAttachment={handleRemoveSavedAttachment}
        onDownloadSavedAttachment={handleDownloadSavedAttachment}
      />

      <PatientFinancialReceiveSheet
        open={receiveSheetOpen}
        onOpenChange={handleReceiveSheetOpenChange}
        entry={receivingEntry}
        onConfirm={handleConfirmReceive}
      />

      <ConfirmDialog
        open={entryToDelete !== null}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            setEntryToDelete(null);
          }
        }}
        title="Excluir lançamento"
        description={
          entryToDelete
            ? `Tem certeza que deseja excluir o lançamento "${entryToDelete.name}"? Esta ação não pode ser desfeita.`
            : ''
        }
        confirmLabel="Excluir"
        cancelLabel="Cancelar"
        confirmVariant="destructive"
        isConfirming={isDeleting}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
}
