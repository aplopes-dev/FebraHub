import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import * as settingsService from '../services/settings-service';

export const STORE_SETTINGS_QUERY_KEY = ['store-settings'] as const;

export function useStoreSettingsQuery() {
  const { storeId } = useStore();
  return useQuery({
    queryKey: [...STORE_SETTINGS_QUERY_KEY, storeId],
    queryFn: () => settingsService.getStoreSettings(),
    enabled: Boolean(storeId),
    retry: false,
  });
}

export function useUpdateStoreSettingsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.updateStoreSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: STORE_SETTINGS_QUERY_KEY });
    },
  });
}

export const STORE_WORK_SCHEDULE_QUERY_KEY = ['store-work-schedule'] as const;

export function useStoreWorkScheduleQuery() {
  return useQuery({
    queryKey: STORE_WORK_SCHEDULE_QUERY_KEY,
    queryFn: () => settingsService.getStoreWorkSchedule(),
  });
}

export function useReplaceStoreWorkScheduleMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: settingsService.replaceStoreWorkSchedule,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: STORE_WORK_SCHEDULE_QUERY_KEY,
      });
    },
  });
}
