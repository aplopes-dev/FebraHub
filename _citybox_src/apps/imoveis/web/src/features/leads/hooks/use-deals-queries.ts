'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateDealStage } from '../services/deals-service';
import type { DealStage } from '../types';
import { dealKeys, leadKeys } from './query-keys';
import { dashboardKeys } from '@/features/dashboard/hooks/query-keys';

export function useUpdateDealStageMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      updateDealStage(id, stage),
    onSuccess: (data) => {
      if (data) {
        qc.setQueryData(leadKeys.detail(data.leadId), (prev: unknown) => {
          if (!prev || typeof prev !== 'object') return prev;
          const clearedProperty = data.stage === 'awaiting_property';
          return {
            ...prev,
            ...(clearedProperty
              ? { matchedProperties: [], propertyName: undefined }
              : {}),
            activeDeal: {
              id: data.id,
              stage: data.stage,
              status: data.status,
              propertyId: data.propertyId,
              propertyName: data.propertyName,
              title: data.title,
            },
          };
        });
      }
      return Promise.all([
        qc.invalidateQueries({ queryKey: dealKeys.all }),
        qc.invalidateQueries({ queryKey: leadKeys.all }),
        qc.invalidateQueries({ queryKey: dashboardKeys.all }),
      ]);
    },
  });
}
