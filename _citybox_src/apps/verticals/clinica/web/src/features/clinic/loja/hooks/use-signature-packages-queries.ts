'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useClinicId } from '@/features/clinic/estoque/lib/use-clinic-id';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { ASSINATURA_PACKAGES } from '../data/assinatura-packages';
import {
  createSignaturePackageRequest,
  getSignatureCredits,
  listSignaturePackageRequests,
  type ListSignaturePackageRequestsParams,
} from '../services/signature-packages.api.service';
import { signaturePackagesKeys } from './query-keys';

export function useSignatureCreditsQuery() {
  const { clinicId, isReady } = useClinicId();

  return useQuery({
    queryKey: signaturePackagesKeys.credits(clinicId),
    queryFn: () => getSignatureCredits(clinicId),
    enabled: isReady,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useSignaturePackageRequestsQuery(
  params: ListSignaturePackageRequestsParams = {},
  enabled = true,
) {
  const { clinicId, isReady } = useClinicId();
  const page = params.page ?? 1;
  const perPage = params.perPage ?? 10;

  return useQuery({
    queryKey: signaturePackagesKeys.requestsList(clinicId, {
      page,
      perPage,
      status: params.status,
    }),
    queryFn: () =>
      listSignaturePackageRequests(clinicId, {
        ...params,
        page,
        perPage,
      }),
    enabled: isReady && enabled,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}

export function useCreateSignaturePackageRequestMutation() {
  const { clinicId } = useClinicId();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (packageId: string) =>
      createSignaturePackageRequest(clinicId, packageId),
    onSuccess: (_data, packageId) => {
      void queryClient.invalidateQueries({
        queryKey: signaturePackagesKeys.requests(clinicId),
      });
      void queryClient.invalidateQueries({
        queryKey: signaturePackagesKeys.credits(clinicId),
      });
      const pkg = ASSINATURA_PACKAGES.find((item) => item.id === packageId);
      const quantity = pkg?.quantity ?? '?';
      toast.success(
        `Solicitação de ${quantity} assinaturas enviada. A liberação é feita pela administração.`,
      );
    },
    onError: (error: unknown) => {
      toastClinicaMutationError(
        error,
        'Não foi possível solicitar o pacote de assinaturas.',
      );
    },
  });
}
