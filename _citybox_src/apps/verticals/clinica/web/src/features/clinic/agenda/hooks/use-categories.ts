import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useStore } from '@/lib/store-context';
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '@/features/clinic/agenda/api/categories';
import type {
  AppointmentCategoryApi,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/clinic/agenda/api/types';

export const categoryQueryKeys = {
  all: ['schedule', 'categories'] as const,
  list: (storeId: string) => [...categoryQueryKeys.all, storeId, 'list'] as const,
};

export function useCategories() {
  const { storeId } = useStore();

  return useQuery<AppointmentCategoryApi[]>({
    queryKey: categoryQueryKeys.list(storeId ?? ''),
    queryFn: () => listCategories(storeId!),
    enabled: Boolean(storeId),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateCategory() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryInput) => createCategory(storeId!, data),
    onSuccess: () => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.list(storeId) });
    },
  });
}

export function useUpdateCategory() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryInput }) =>
      updateCategory(storeId!, id, data),
    onSuccess: () => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.list(storeId) });
    },
  });
}

export function useDeleteCategory() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(storeId!, id),
    onSuccess: () => {
      if (!storeId) return;
      queryClient.invalidateQueries({ queryKey: categoryQueryKeys.list(storeId) });
    },
  });
}
