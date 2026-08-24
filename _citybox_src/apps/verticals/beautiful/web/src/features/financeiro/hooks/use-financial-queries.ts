import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from '@citybox/mui/molecules';
import { BeautifulApiError } from '@/lib/beautiful-api';
import {
  financialService,
  statsFromPaymentMethodSummaries,
  type CreateCategoryPayload,
  type CreateEntryPayload,
  type CreateFinancialAccountPayload,
  type ListEntriesParams,
  type PayEntryPayload,
  type ReceiveEntryPayload,
  type StatsParams,
  type UpdateCategoryPayload,
  type UpdateEntryPayload,
  type UpdateFinancialAccountPayload,
} from '../services/financial-service';
import type { CashFlowFilters, TransactionsFilters } from '../types';
import {
  buildCashFlowApiParams,
  buildTransactionsApiParams,
  buildTransactionsByMethodApiParams,
  refineCashFlowEntriesClientSide,
} from '../lib/build-api-params';

export const FINANCIAL_ENTRIES_KEY = ['financial-entries'] as const;
export const FINANCIAL_STATS_KEY = ['financial-stats'] as const;
export const FINANCIAL_ACCOUNTS_KEY = ['financial-accounts'] as const;
export const FINANCIAL_CATEGORIES_KEY = ['financial-categories'] as const;
export const FINANCIAL_TRANSACTIONS_KEY = ['financial-transactions'] as const;

function mutationErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof BeautifulApiError && err.message) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

function invalidateFinancialQueries(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: FINANCIAL_ENTRIES_KEY });
  queryClient.invalidateQueries({ queryKey: FINANCIAL_STATS_KEY });
  queryClient.invalidateQueries({ queryKey: FINANCIAL_TRANSACTIONS_KEY });
}

// ─── Accounts ───────────────────────────────────────────────────────────────

export function useFinancialAccountsQuery(options?: {
  includeInactive?: boolean;
}) {
  return useQuery({
    queryKey: [...FINANCIAL_ACCOUNTS_KEY, options],
    queryFn: () => financialService.accounts.list(options),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateFinancialAccountPayload) =>
      financialService.accounts.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
      toast.success('Conta criada');
    },
    onError: (err) => {
      toast.error('Não foi possível criar a conta', {
        description: mutationErrorMessage(
          err,
          'Verifique se o nome já existe e tente novamente.',
        ),
      });
    },
  });
}

export function useUpdateFinancialAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFinancialAccountPayload;
    }) => financialService.accounts.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
      toast.success('Conta atualizada');
    },
    onError: (err) => {
      toast.error('Não foi possível atualizar a conta', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useDeleteFinancialAccountMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.accounts.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_ACCOUNTS_KEY });
      toast.success('Conta excluída');
    },
    onError: (err) => {
      toast.error('Não foi possível excluir a conta', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

// ─── Categories ─────────────────────────────────────────────────────────────

export function useExpenseCategoriesQuery() {
  return useQuery({
    queryKey: [...FINANCIAL_CATEGORIES_KEY, 'expense'],
    queryFn: () => financialService.categories.list('expense'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useIncomeCategoriesQuery() {
  return useQuery({
    queryKey: [...FINANCIAL_CATEGORIES_KEY, 'income'],
    queryFn: () => financialService.categories.list('income'),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateFinancialCategoryMutation(kind: 'income' | 'expense') {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryPayload) =>
      financialService.categories.create(kind, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [...FINANCIAL_CATEGORIES_KEY, kind],
      });
      toast.success('Categoria criada');
    },
    onError: (err) => {
      toast.error('Não foi possível criar a categoria', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useUpdateFinancialCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateCategoryPayload;
    }) => financialService.categories.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_CATEGORIES_KEY });
      toast.success('Categoria atualizada');
    },
    onError: (err) => {
      toast.error('Não foi possível atualizar a categoria', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useDeleteFinancialCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.categories.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: FINANCIAL_CATEGORIES_KEY });
      toast.success('Categoria excluída');
    },
    onError: (err) => {
      toast.error('Não foi possível excluir a categoria', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

// ─── Entries / stats / transactions ─────────────────────────────────────────

export function useFinancialEntriesQuery(params: ListEntriesParams) {
  return useQuery({
    queryKey: [...FINANCIAL_ENTRIES_KEY, params],
    queryFn: () => financialService.entries.list(params),
    enabled: Boolean(params.startDate && params.endDate),
    staleTime: 0,
  });
}

export function useCashFlowEntriesQuery(input: {
  startDate: string;
  endDate: string;
  filters: CashFlowFilters;
}) {
  const apiParams = buildCashFlowApiParams(input);
  const query = useFinancialEntriesQuery(apiParams);

  return {
    ...query,
    data: query.data
      ? {
          ...query.data,
          entries: refineCashFlowEntriesClientSide(
            query.data.entries,
            input.filters,
          ),
        }
      : undefined,
  };
}

export function useFinancialStatsQuery(
  params: StatsParams,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: [...FINANCIAL_STATS_KEY, params],
    queryFn: () => financialService.entries.stats(params),
    enabled:
      Boolean(params.startDate || params.endDate) &&
      (options?.enabled ?? true),
    staleTime: 0,
  });
}

export function useTransactionsListQuery(input: {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = input;
  const apiParams = buildTransactionsApiParams(rest);
  return useQuery({
    queryKey: [...FINANCIAL_TRANSACTIONS_KEY, 'list', apiParams],
    queryFn: () => financialService.entries.list(apiParams),
    enabled: enabled && Boolean(rest.startDate && rest.endDate),
    staleTime: 0,
  });
}

export function useTransactionsByMethodQuery(input: {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
  enabled?: boolean;
}) {
  const { enabled = true, ...rest } = input;
  const apiParams = buildTransactionsByMethodApiParams(rest);
  return useQuery({
    queryKey: [...FINANCIAL_TRANSACTIONS_KEY, 'by-method', apiParams],
    queryFn: () => financialService.entries.listByPaymentMethod(apiParams),
    enabled: enabled && Boolean(rest.startDate && rest.endDate),
    staleTime: 0,
  });
}

export function useTransactionsStatsQuery(input: {
  startDate: string;
  endDate: string;
  filters: TransactionsFilters;
}) {
  const byMethod = useTransactionsByMethodQuery(input);
  return {
    ...byMethod,
    data: byMethod.data
      ? statsFromPaymentMethodSummaries(byMethod.data)
      : undefined,
  };
}

export function useCreateFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateEntryPayload) =>
      financialService.entries.create(data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Lançamento criado');
    },
    onError: (err) => {
      toast.error('Não foi possível criar o lançamento', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useUpdateFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryPayload }) =>
      financialService.entries.update(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Lançamento atualizado');
    },
    onError: (err) => {
      toast.error('Não foi possível atualizar o lançamento', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useDeleteFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.entries.delete(id),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Lançamento excluído');
    },
    onError: (err) => {
      toast.error('Não foi possível excluir o lançamento', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useReceiveFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ReceiveEntryPayload }) =>
      financialService.entries.receive(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Recebimento registrado');
    },
    onError: (err) => {
      toast.error('Não foi possível registrar o recebimento', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function usePayFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PayEntryPayload }) =>
      financialService.entries.pay(id, data),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Pagamento registrado');
    },
    onError: (err) => {
      toast.error('Não foi possível registrar o pagamento', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}

export function useCancelFinancialEntryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => financialService.entries.cancel(id),
    onSuccess: () => {
      invalidateFinancialQueries(queryClient);
      toast.success('Liquidação cancelada');
    },
    onError: (err) => {
      toast.error('Não foi possível cancelar a liquidação', {
        description: mutationErrorMessage(err, 'Tente novamente em instantes.'),
      });
    },
  });
}
