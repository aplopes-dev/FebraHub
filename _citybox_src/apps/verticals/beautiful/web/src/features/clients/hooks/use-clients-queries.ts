import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as clientService from '../services/client-service';
import type { ClientFormData } from '../types/client.types';

export const CLIENTS_QUERY_KEY = ['clients'] as const;

export function useClientsQuery(params?: clientService.ListClientsParams) {
  return useQuery({
    queryKey: [...CLIENTS_QUERY_KEY, params],
    queryFn: () => clientService.listClients(params),
  });
}

export function useCreateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClientFormData) => clientService.createClient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export function useUpdateClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientFormData }) =>
      clientService.updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}

export function useDeleteClientMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => clientService.deleteClient(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CLIENTS_QUERY_KEY });
    },
  });
}
