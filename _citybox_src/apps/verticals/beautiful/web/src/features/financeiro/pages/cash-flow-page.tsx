'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { toast } from '@citybox/mui/molecules';
import { CashFlowHeader } from '../components/cash-flow-header';
import { CashFlowStats } from '../components/cash-flow-stats';
import { CashFlowTable } from '../components/cash-flow-table';
import {
  EntryFormDrawer,
  type EntryFormValues,
} from '../components/entry-form-drawer';
import {
  SettleEntryDrawer,
  type SettleEntryFormValues,
} from '../components/settle-entry-drawer';
import {
  useCancelFinancialEntryMutation,
  useCashFlowEntriesQuery,
  useCreateFinancialEntryMutation,
  useDeleteFinancialEntryMutation,
  useExpenseCategoriesQuery,
  useFinancialAccountsQuery,
  useFinancialStatsQuery,
  useIncomeCategoriesQuery,
  usePayFinancialEntryMutation,
  useReceiveFinancialEntryMutation,
  useUpdateFinancialEntryMutation,
} from '../hooks/use-financial-queries';
import { parseCashFlowDeepLink } from '../lib/cash-flow-deep-link';
import { computeStatsFromEntries } from '../lib/filter-entries';
import { parseIsoDate, resolvePeriodDates } from '../lib/period';
import type { CashFlowFilters, CashFlowPeriodFilter, FinancialEntry } from '../types';
import { EMPTY_CASH_FLOW_FILTERS } from '../types';

const EMPTY_STATS = {
  income: { received: 0, toReceive: 0, total: 0 },
  expense: { paid: 0, toPay: 0, total: 0 },
  balance: { current: 0, projected: 0 },
};

type EntryDialogState =
  | { mode: 'create'; type: 'income' | 'expense' }
  | { mode: 'edit'; entry: FinancialEntry }
  | null;

type SettleDialogState =
  | { mode: 'receive' | 'pay'; entry: FinancialEntry; viewMode?: boolean }
  | null;

export function CashFlowPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const deepLinkAppliedRef = useRef(false);

  const [periodFilter, setPeriodFilter] =
    useState<CashFlowPeriodFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<CashFlowFilters>(
    EMPTY_CASH_FLOW_FILTERS,
  );
  const [entryDialog, setEntryDialog] = useState<EntryDialogState>(null);
  const [settleDialog, setSettleDialog] = useState<SettleDialogState>(null);
  const [entrySaving, setEntrySaving] = useState(false);

  useEffect(() => {
    if (deepLinkAppliedRef.current) return;

    const deepLink = parseCashFlowDeepLink(searchParams);
    if (!deepLink) return;

    deepLinkAppliedRef.current = true;
    setPeriodFilter(deepLink.period);
    if (deepLink.period === 'custom') {
      setCustomStartDate(
        deepLink.startDate ? parseIsoDate(deepLink.startDate) : undefined,
      );
      setCustomEndDate(
        deepLink.endDate ? parseIsoDate(deepLink.endDate) : undefined,
      );
    }
    setFilters(deepLink.filters);
    router.replace(pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  const range = useMemo(
    () => resolvePeriodDates(periodFilter, customStartDate, customEndDate),
    [periodFilter, customStartDate, customEndDate],
  );

  const { data: accounts = [] } = useFinancialAccountsQuery({
    includeInactive: false,
  });
  const { data: expenseCategories = [] } = useExpenseCategoriesQuery();
  const { data: incomeCategories = [] } = useIncomeCategoriesQuery();
  const categories = useMemo(
    () => [...expenseCategories, ...incomeCategories],
    [expenseCategories, incomeCategories],
  );

  const hasActiveFilters = useMemo(
    () =>
      filters.types.length > 0 ||
      filters.statuses.length > 0 ||
      filters.hasReceipt !== 'all' ||
      filters.cashRegisters.length > 0 ||
      filters.paymentMethods.length > 0 ||
      filters.categories.length > 0,
    [filters],
  );

  const { data: entriesData, isPending: entriesLoading } = useCashFlowEntriesQuery({
    startDate: range.startDate,
    endDate: range.endDate,
    filters,
  });

  const { data: statsData } = useFinancialStatsQuery(
    { startDate: range.startDate, endDate: range.endDate },
    { enabled: !hasActiveFilters },
  );

  const entries = entriesData?.entries ?? [];
  const stats = hasActiveFilters
    ? computeStatsFromEntries(entries)
    : (statsData ?? EMPTY_STATS);

  const createEntry = useCreateFinancialEntryMutation();
  const updateEntry = useUpdateFinancialEntryMutation();
  const deleteEntry = useDeleteFinancialEntryMutation();
  const cancelEntry = useCancelFinancialEntryMutation();
  const receiveEntry = useReceiveFinancialEntryMutation();
  const payEntry = usePayFinancialEntryMutation();

  const settleBusy = receiveEntry.isPending || payEntry.isPending;

  const handleEntrySubmit = async (values: EntryFormValues) => {
    if (entryDialog?.mode === 'edit') {
      const entry = entryDialog.entry;
      updateEntry.mutate(
        {
          id: entry.id,
          data: {
            description: values.description,
            value: values.value,
            dueDate: values.dueDate,
            categoryId:
              entry.type === 'expense'
                ? (values.categoryId ?? null)
                : undefined,
            incomeCategoryId:
              entry.type === 'income'
                ? (values.incomeCategoryId ?? null)
                : undefined,
          },
        },
        {
          onSuccess: () => setEntryDialog(null),
        },
      );
      return;
    }

    if (!entryDialog || entryDialog.mode !== 'create') return;

    const type = entryDialog.type;
    setEntrySaving(true);
    try {
      const created = await createEntry.mutateAsync({
        type,
        description: values.description,
        value: values.value,
        dueDate: values.dueDate,
        ...(values.categoryId ? { categoryId: values.categoryId } : {}),
        ...(values.incomeCategoryId
          ? { incomeCategoryId: values.incomeCategoryId }
          : {}),
        ...(values.accountId && !values.isPaid
          ? { accountId: values.accountId }
          : {}),
        ...(values.paymentMethod && !values.isPaid
          ? { paymentMethod: values.paymentMethod }
          : {}),
      });

      if (values.isPaid && created.ids[0]) {
        const entryId = created.ids[0];
        const settlePayload = {
          paymentMethod: values.paymentMethod!,
          accountId: values.accountId!,
          paidValue: values.paidValue ?? values.value,
        };
        if (type === 'income') {
          await receiveEntry.mutateAsync({
            id: entryId,
            data: {
              ...settlePayload,
              receivedAt: values.settledAt ?? values.dueDate,
            },
          });
        } else {
          await payEntry.mutateAsync({
            id: entryId,
            data: {
              ...settlePayload,
              paidAt: values.settledAt ?? values.dueDate,
            },
          });
        }
      }

      setEntryDialog(null);
    } catch {
      // Hooks already toast create/settle errors
    } finally {
      setEntrySaving(false);
    }
  };

  const handleSettleSubmit = (values: SettleEntryFormValues) => {
    if (!settleDialog) return;
    const { entry, mode } = settleDialog;
    if (mode === 'receive') {
      receiveEntry.mutate(
        {
          id: entry.id,
          data: {
            paymentMethod: values.paymentMethod,
            accountId: values.accountId,
            paidValue: values.paidValue,
            receivedAt: values.settledAt,
          },
        },
        { onSuccess: () => setSettleDialog(null) },
      );
      return;
    }
    payEntry.mutate(
      {
        id: entry.id,
        data: {
          paymentMethod: values.paymentMethod,
          accountId: values.accountId,
          paidValue: values.paidValue,
          paidAt: values.settledAt,
        },
      },
      { onSuccess: () => setSettleDialog(null) },
    );
  };

  const openEdit = (entry: FinancialEntry) => {
    if (entry.status !== 'pending' || entry.origin !== 'manual') {
      toast.info('Edição indisponível', {
        description: 'Só lançamentos manuais pendentes podem ser editados.',
      });
      return;
    }
    setEntryDialog({ mode: 'edit', entry });
  };

  const entryDialogType =
    entryDialog?.mode === 'create'
      ? entryDialog.type
      : entryDialog?.mode === 'edit'
        ? entryDialog.entry.type
        : 'income';

  const entryDialogEntry =
    entryDialog?.mode === 'edit' ? entryDialog.entry : null;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        flex: 1,
        pt: 2,
      }}
    >
      <Stack spacing={2.5} sx={{ shrink: 0 }}>
        <CashFlowStats
          income={stats.income}
          expense={stats.expense}
          balance={stats.balance}
        />
        <CashFlowHeader
          period={periodFilter}
          startDate={customStartDate}
          endDate={customEndDate}
          onPeriodChange={setPeriodFilter}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          filters={filters}
          onFiltersChange={setFilters}
          accounts={accounts}
          categories={categories}
          onAddIncome={() => setEntryDialog({ mode: 'create', type: 'income' })}
          onAddExpense={() =>
            setEntryDialog({ mode: 'create', type: 'expense' })
          }
          onExport={() =>
            toast.info('Exportar PDF', {
              description: 'Exportação em breve.',
            })
          }
        />
      </Stack>

      <CashFlowTable
        entries={entries}
        isLoading={entriesLoading}
        onReceive={(entry) => setSettleDialog({ mode: 'receive', entry })}
        onPay={(entry) => setSettleDialog({ mode: 'pay', entry })}
        onEdit={openEdit}
        onDelete={(entry) => deleteEntry.mutate(entry.id)}
        onViewPayment={(entry) => {
          const mode = entry.type === 'income' ? 'receive' : 'pay';
          setSettleDialog({ mode, entry, viewMode: true });
        }}
        onCancelPayment={(entry) => cancelEntry.mutate(entry.id)}
      />

      <EntryFormDrawer
        open={Boolean(entryDialog)}
        onClose={() => setEntryDialog(null)}
        onSubmit={handleEntrySubmit}
        type={entryDialogType}
        entry={entryDialogEntry}
        accounts={accounts}
        expenseCategories={expenseCategories}
        incomeCategories={incomeCategories}
        loading={
          entrySaving || createEntry.isPending || updateEntry.isPending
        }
      />

      <SettleEntryDrawer
        open={Boolean(settleDialog)}
        onClose={() => setSettleDialog(null)}
        onSubmit={handleSettleSubmit}
        entry={settleDialog?.entry ?? null}
        mode={settleDialog?.mode ?? 'receive'}
        viewMode={settleDialog?.viewMode ?? false}
        accounts={accounts}
        loading={settleBusy}
      />
    </Box>
  );
}
