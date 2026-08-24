'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { toast } from '@citybox/mui/molecules';
import { financeKeys } from '@/features/finance/hooks/query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { dealKeys } from '@/features/leads/hooks/query-keys';
import { leadKeys } from '@/features/leads/hooks/query-keys';
import { useSessionUser } from '@/features/shared/session/hooks/use-session';
import { createTransactionFromDraft } from '../services/create-transaction';
import type { CreateTransactionDraft } from '../types';
import { transactionKeys } from './query-keys';

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const sessionUser = useSessionUser();

  return useMutation({
    mutationFn: (draft: CreateTransactionDraft) =>
      createTransactionFromDraft(draft, sessionUser),
    onSuccess: (transaction) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
      queryClient.invalidateQueries({ queryKey: dealKeys.all });
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Transação criada.');
      router.push(`/transactions/${transaction.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Erro ao criar transação.');
    },
  });
}
