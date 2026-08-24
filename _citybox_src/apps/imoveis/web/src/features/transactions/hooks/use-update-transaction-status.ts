'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { financeKeys } from '@/features/finance/hooks/query-keys';
import { propertyKeys } from '@/features/properties/hooks/query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';
import { updateDealStage } from '@/features/leads/services/deals-service';
import { getLeadById } from '@/features/leads/services/leads-service';
import { dealKeys, leadKeys } from '@/features/leads/hooks/query-keys';
import { updateTransactionStatus } from '../services/transactions-service';
import { transactionKeys } from './query-keys';

type UpdateStatusInput = {
  id: string;
  status: 'COMPLETED' | 'CANCELLED';
  actorName: string;
};

export function useUpdateTransactionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateStatusInput) =>
      updateTransactionStatus(input.id, input.status, input.actorName),
    onSuccess: async (data, variables) => {
      if (variables.status === 'COMPLETED') {
        const dealId =
          data.dealId ??
          (data.leadId
            ? (await getLeadById(data.leadId))?.activeDeal?.id
            : undefined);
        if (dealId) {
          await updateDealStage(dealId, 'payment_confirmed');
        }
      }

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: transactionKeys.lists() }),
        queryClient.invalidateQueries({
          queryKey: transactionKeys.detail(data.id),
        }),
        queryClient.invalidateQueries({ queryKey: transactionKeys.reports() }),
        queryClient.invalidateQueries({ queryKey: financeKeys.all }),
        queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
        queryClient.invalidateQueries({ queryKey: dashboardKeys.all }),
        queryClient.refetchQueries({ queryKey: dealKeys.all }),
        queryClient.invalidateQueries({ queryKey: leadKeys.all }),
      ]);
    },
  });
}
