'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeKeys } from '@/features/finance/hooks/query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { updateRentalPayoutStatus } from '../services/transactions-service';
import type { RentalPayoutStatus } from '../types';
import { transactionKeys } from './query-keys';

type UpdatePayoutInput = {
  id: string;
  status: RentalPayoutStatus;
  actorName: string;
};

export function useUpdateRentalPayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdatePayoutInput) =>
      updateRentalPayoutStatus(input.id, input.status, input.actorName),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: transactionKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: financeKeys.all });
      queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
    },
  });
}
