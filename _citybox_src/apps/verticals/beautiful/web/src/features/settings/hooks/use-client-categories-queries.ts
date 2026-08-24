import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as clientCategoriesService from '../services/client-categories-service';
import type { ClientCategoryInput } from '../services/client-categories-service';

export const CLIENT_CATEGORIES_QUERY_KEY = ['client-categories'] as const;

export function useClientCategoriesQuery() {
  return useQuery({
    queryKey: CLIENT_CATEGORIES_QUERY_KEY,
    queryFn: () => clientCategoriesService.listClientCategories(),
  });
}

export function useCreateClientCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientCategoryInput) =>
      clientCategoriesService.createClientCategory(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useUpdateClientCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: ClientCategoryInput & { id: string }) =>
      clientCategoriesService.updateClientCategory(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_CATEGORIES_QUERY_KEY });
    },
  });
}

export function useDeleteClientCategoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      clientCategoriesService.deleteClientCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENT_CATEGORIES_QUERY_KEY });
    },
  });
}
