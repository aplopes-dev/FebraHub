'use client';

import { useEffect, useMemo, useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import { Button, Skeleton, Stack, Typography } from '@citybox/mui/atoms';
import { SearchInput } from '@citybox/mui/molecules';
import {
  FilterPills,
  FilterPopover,
  type FilterValues,
} from '@/components/filters';
import { ListifyPagination } from '@/components/ui/listify-pagination';
import { useDebouncedValue } from '@/features/leads/hooks/use-debounced-value';
import {
  buildPerPageOptions,
  DEFAULT_PER_PAGE,
} from '@/features/shared/utils/build-per-page-options';
import {
  buildTransactionsFilterGroups,
  EMPTY_TRANSACTIONS_FILTERS,
} from '../data/transactions-filters';
import { useAssignableTransactionAgents } from '@/features/settings/hooks/use-team-members-by-permission';
import { useTransactions } from '../hooks/use-transactions';
import type { ListTransactionsParams, TransactionStatus, TransactionType } from '../types';
import { CreateTransactionDialog } from './create-transaction-dialog';
import { TransactionsDealsKpiGrid } from './transactions-deals-kpi-grid';
import { TransactionsLayoutShell } from './transactions-layout-shell';
import { TransactionsTable } from './transactions-table';
import { searchInputSx } from '../utils/form-control-styles';

function asStringList(value: FilterValues[string] | undefined): string[] {
  return Array.isArray(value) ? value : [];
}

function filtersToParams(filters: FilterValues): Pick<
  ListTransactionsParams,
  'type' | 'status' | 'agentId'
> {
  const agents = asStringList(filters.agentId);
  return {
    type: asStringList(filters.type) as TransactionType[],
    status: asStringList(filters.status) as TransactionStatus[],
    agentId: agents.length === 1 ? agents[0] : undefined,
  };
}

export function TransactionsPageContent() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(DEFAULT_PER_PAGE);
  const [filters, setFilters] = useState<FilterValues>(EMPTY_TRANSACTIONS_FILTERS);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedSearch = useDebouncedValue(search, 400);
  const filterParams = useMemo(() => filtersToParams(filters), [filters]);
  const { members: transactionAgents } = useAssignableTransactionAgents();
  const filterGroups = useMemo(
    () => buildTransactionsFilterGroups(transactionAgents),
    [transactionAgents],
  );

  const { data, isLoading, isError } = useTransactions({
    search: debouncedSearch,
    page,
    perPage,
    ...filterParams,
  });

  const total = data?.meta.total ?? 0;
  const perPageOptions = useMemo(() => buildPerPageOptions(total), [total]);

  useEffect(() => {
    if (!perPageOptions.includes(perPage)) {
      setPerPage(perPageOptions[0] ?? DEFAULT_PER_PAGE);
      setPage(1);
    }
  }, [perPage, perPageOptions]);

  return (
    <TransactionsLayoutShell
      title="Transações"
      description="Propostas, contratos, comissões e o fechamento de cada negócio."
    >
      <Stack spacing={2}>
        <TransactionsDealsKpiGrid />

        <Stack
          direction={{ xs: 'column', lg: 'row' }}
          spacing={1.5}
          sx={{ alignItems: { lg: 'center' }, justifyContent: 'space-between' }}
        >
          <SearchInput
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar negócios…"
            fullWidth
            sx={{ flex: 1, maxWidth: { lg: 448 }, ...searchInputSx }}
          />
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', alignItems: 'center' }}>
            <FilterPopover
              groups={filterGroups}
              values={filters}
              onValuesChange={(next) => {
                setFilters(next);
                setPage(1);
              }}
            />
            <Button
              type="button"
              variant="contained"
              startIcon={<AddIcon fontSize="small" />}
              onClick={() => setCreateOpen(true)}
              sx={{ borderRadius: 999, height: 44, px: 2.5 }}
            >
              Nova transação
            </Button>
          </Stack>
        </Stack>

        <FilterPills
          groups={filterGroups}
          values={filters}
          onValuesChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
        />

        {isLoading ? (
          <Stack spacing={1.5}>
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 6 }} />
            ))}
          </Stack>
        ) : isError ? (
          <Typography variant="body2" color="error">
            Erro ao carregar transações.
          </Typography>
        ) : (
          <TransactionsTable transactions={data?.data ?? []} />
        )}

        <ListifyPagination
          count={total}
          page={data?.meta.page ?? page}
          perPage={perPage}
          onPageChange={setPage}
          onPerPageChange={(next) => {
            setPerPage(next);
            setPage(1);
          }}
          rowsPerPageOptions={perPageOptions}
        />
      </Stack>

      <CreateTransactionDialog open={createOpen} onOpenChange={setCreateOpen} />
    </TransactionsLayoutShell>
  );
}
