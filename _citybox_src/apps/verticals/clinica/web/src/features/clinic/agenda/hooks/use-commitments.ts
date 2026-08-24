import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  createCommitment,
  deleteCommitment,
  getCommitment,
  updateCommitment,
} from '@/features/clinic/agenda/api/commitments';
import type {
  CommitmentApi,
  CreateCommitmentInput,
  UpdateCommitmentInput,
} from '@/features/clinic/agenda/api/types';
import { calendarQueryKeys } from './use-calendar';
import { fitInQueryKeys } from './use-fit-ins';

export const commitmentQueryKeys = {
  all: ['schedule', 'commitments'] as const,
  detail: (storeId: string, id: string) =>
    [...commitmentQueryKeys.all, storeId, id] as const,
};

function invalidateAfterCommitmentMutation(
  queryClient: ReturnType<typeof useQueryClient>,
  storeId: string | null | undefined,
  commitmentId?: string,
) {
  queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
  queryClient.invalidateQueries({ queryKey: fitInQueryKeys.all });
  if (storeId && commitmentId) {
    queryClient.invalidateQueries({
      queryKey: commitmentQueryKeys.detail(storeId, commitmentId),
    });
  }
}

export function useCommitment(id: string) {
  const { storeId } = useStore();

  return useQuery<CommitmentApi>({
    queryKey: commitmentQueryKeys.detail(storeId ?? '', id),
    queryFn: () => getCommitment(storeId!, id),
    enabled: Boolean(storeId) && Boolean(id),
  });
}

export function useCreateCommitment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommitmentInput) => createCommitment(storeId!, data),
    onSuccess: () => {
      invalidateAfterCommitmentMutation(queryClient, storeId);
    },
  });
}

export function useUpdateCommitment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCommitmentInput }) =>
      updateCommitment(storeId!, id, data),
    onSuccess: (_, { id }) => {
      invalidateAfterCommitmentMutation(queryClient, storeId, id);
    },
  });
}

export function useDeleteCommitment() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCommitment(storeId!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: calendarQueryKeys.all });
    },
  });
}
