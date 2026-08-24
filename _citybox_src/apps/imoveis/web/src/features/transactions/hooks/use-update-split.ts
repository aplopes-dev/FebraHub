'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeKeys } from '@/features/finance/hooks/query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { updateTransactionSplit } from '../services/transactions-service';
import type { CommissionSplit, SplitSource } from '../types';
import { transactionKeys } from './query-keys';

type UpdateSplitInput = {
  id: string;
  commissionPercent: number;
  split: CommissionSplit;
  source: SplitSource;
  actorName: string;
};

export function useUpdateSplit() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateSplitInput) =>
      updateTransactionSplit(
        input.id,
        input.split,
        input.source,
        input.actorName,
        input.commissionPercent,
      ),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: transactionKeys.reports() });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
