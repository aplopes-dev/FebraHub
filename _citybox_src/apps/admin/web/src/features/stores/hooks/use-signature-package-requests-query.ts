'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { extractApiMessage } from '@/lib/api-error';
import { storesKeys } from '../api/query-keys';
import {
  cancelSignaturePackageRequest,
  liberateSignaturePackageRequest,
  listSignaturePackageRequests,
} from '../api/stores-api';

/**
 * Solicitações de pacote de assinatura da loja (proxy → clinica-api).
 * Só faz sentido para lojas `vertical === 'Clínica'`.
 */
export function useSignaturePackageRequestsQuery(storeId: string) {
  const query = useQuery({
    queryKey: storesKeys.signaturePackageRequests(storeId),
    queryFn: () => listSignaturePackageRequests(storeId),
    enabled: Boolean(storeId),
  });

  return {
    requests: query.data ?? [],
    isPending: query.isPending,
    error: query.error,
  };
}

export function useLiberateSignaturePackageRequestMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      liberateSignaturePackageRequest(storeId, requestId),
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({
        queryKey: storesKeys.signaturePackageRequests(storeId),
      });
      toast.success(
        `Pacote liberado. +${data.quantity} assinaturas creditadas no saldo da clínica.`,
      );
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}

export function useCancelSignaturePackageRequestMutation(storeId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (requestId: string) =>
      cancelSignaturePackageRequest(storeId, requestId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: storesKeys.signaturePackageRequests(storeId),
      });
      toast.success('Solicitação cancelada. A clínica pode solicitar de novo.');
    },
    onError: (err) => {
      toast.error(extractApiMessage(err));
    },
  });
}
