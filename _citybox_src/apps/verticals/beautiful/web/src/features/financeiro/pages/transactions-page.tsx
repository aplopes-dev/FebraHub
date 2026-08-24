'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { toast } from '@citybox/mui/molecules';
import { CashFlowStats } from '../components/cash-flow-stats';
import { CashFlowTable } from '../components/cash-flow-table';
import { TransactionsByMethodTable } from '../components/transactions-by-method-table';
import { TransactionsHeader } from '../components/transactions-header';
import {
  useCancelFinancialEntryMutation,
  useDeleteFinancialEntryMutation,
  useFinancialAccountsQuery,
  useTransactionsByMethodQuery,
  useTransactionsListQuery,
  useTransactionsStatsQuery,
} from '../hooks/use-financial-queries';
import { buildCashFlowHref } from '../lib/cash-flow-deep-link';
import { resolvePeriodDates } from '../lib/period';
import type {
  CashFlowPeriodFilter,
  TransactionsFilters,
  TransactionsViewMode,
} from '../types';
import { EMPTY_TRANSACTIONS_FILTERS } from '../types';

const EMPTY_STATS = {
  income: { received: 0, toReceive: 0, total: 0 },
  expense: { paid: 0, toPay: 0, total: 0 },
  balance: { current: 0, projected: 0 },
};

export function TransactionsPage() {
  const router = useRouter();
  const [periodFilter, setPeriodFilter] =
    useState<CashFlowPeriodFilter>('this_month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [filters, setFilters] = useState<TransactionsFilters>(
    EMPTY_TRANSACTIONS_FILTERS,
  );
  const [viewMode, setViewMode] =
    useState<TransactionsViewMode>('payment_method');

  const range = useMemo(
    () => resolvePeriodDates(periodFilter, customStartDate, customEndDate),
    [periodFilter, customStartDate, customEndDate],
  );

  const queryInput = {
    startDate: range.startDate,
    endDate: range.endDate,
    filters,
  };

  const { data: accounts = [] } = useFinancialAccountsQuery({
    includeInactive: false,
  });
  const { data: byMethod = [], isPending: byMethodLoading } =
    useTransactionsByMethodQuery({
      ...queryInput,
      enabled: viewMode === 'payment_method',
    });
  const { data: listData, isPending: listLoading } = useTransactionsListQuery({
    ...queryInput,
    enabled: viewMode === 'transactions',
  });
  const { data: stats = EMPTY_STATS } = useTransactionsStatsQuery(queryInput);

  const entries = listData?.entries ?? [];
  const deleteEntry = useDeleteFinancialEntryMutation();
  const cancelEntry = useCancelFinancialEntryMutation();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: 0,
        flex: 1,
        minHeight: 0,
        pt: 2,
      }}
    >
      <Stack spacing={2.5}>
        <CashFlowStats
          income={stats.income}
          expense={stats.expense}
          balance={stats.balance}
        />
        <TransactionsHeader
          period={periodFilter}
          startDate={customStartDate}
          endDate={customEndDate}
          onPeriodChange={setPeriodFilter}
          onStartDateChange={setCustomStartDate}
          onEndDateChange={setCustomEndDate}
          filters={filters}
          onFiltersChange={setFilters}
          accounts={accounts}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          onExport={() =>
            toast.info('Exportar PDF', {
              description: 'Exportação em breve.',
            })
          }
        />
      </Stack>

      {viewMode === 'payment_method' ? (
        <TransactionsByMethodTable
          rows={byMethod}
          isLoading={byMethodLoading}
          onViewMethod={(method) => {
            router.push(
              buildCashFlowHref({
                period: periodFilter,
                startDate: range.startDate,
                endDate: range.endDate,
                paymentMethods: [method],
                types: filters.types,
                statuses:
                  filters.statuses.length > 0 ? filters.statuses : ['paid'],
                cashRegisters: filters.cashRegisters,
              }),
            );
          }}
        />
      ) : (
        <CashFlowTable
          entries={entries}
          isLoading={listLoading}
          onViewPayment={(entry) =>
            toast.info('Ver pagamento', {
              description: `${entry.description} — detalhes em breve.`,
            })
          }
          onCancelPayment={(entry) => cancelEntry.mutate(entry.id)}
          onDelete={(entry) => deleteEntry.mutate(entry.id)}
        />
      )}
    </Box>
  );
}
