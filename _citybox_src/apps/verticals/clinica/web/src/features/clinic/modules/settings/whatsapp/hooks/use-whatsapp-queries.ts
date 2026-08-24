'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { toastClinicaMutationError } from '@/features/clinic/shared/api';
import { useStore } from '@/lib/store-context';
import {
  disconnectWhatsappSession,
  getWhatsappSession,
  listWhatsappTemplates,
  requestWhatsappQr,
  updateWhatsappTemplates,
} from '../services/whatsapp.service';
import type { WhatsappTemplateKey } from '../types/whatsapp';

export const whatsappKeys = {
  session: (storeId: string) => ['whatsapp-session', storeId] as const,
  templates: (storeId: string) => ['whatsapp-templates', storeId] as const,
};

export function useWhatsappSessionQuery() {
  const { storeId } = useStore();

  return useQuery({
    queryKey: whatsappKeys.session(storeId ?? ''),
    queryFn: () => getWhatsappSession(storeId!),
    enabled: Boolean(storeId),
    refetchInterval: (query) =>
      query.state.data?.status === 'qr_pending' ? 2000 : false,
  });
}

export function useWhatsappTemplatesQuery() {
  const { storeId } = useStore();

  return useQuery({
    queryKey: whatsappKeys.templates(storeId ?? ''),
    queryFn: () => listWhatsappTemplates(storeId!),
    enabled: Boolean(storeId),
  });
}

export function useWhatsappMutations() {
  const { storeId } = useStore();
  const queryClient = useQueryClient();

  const invalidateSession = () =>
    queryClient.invalidateQueries({
      queryKey: whatsappKeys.session(storeId ?? ''),
    });

  const invalidateTemplates = () =>
    queryClient.invalidateQueries({
      queryKey: whatsappKeys.templates(storeId ?? ''),
    });

  const requestQr = useMutation({
    mutationFn: async (options?: { silent?: boolean }) => {
      await requestWhatsappQr(storeId!);
      return { silent: options?.silent === true };
    },
    onSuccess: (result) => {
      void invalidateSession();
      if (!result.silent) {
        toast.success(
          'QR Code solicitado. Escaneie com o WhatsApp do celular.',
        );
      }
    },
    onError: (error) =>
      toastClinicaMutationError(error, 'Não foi possível gerar o QR Code.'),
  });

  const disconnect = useMutation({
    mutationFn: () => disconnectWhatsappSession(storeId!),
    onSuccess: () => {
      void invalidateSession();
      toast.success('WhatsApp desconectado.');
    },
    onError: (error) =>
      toastClinicaMutationError(error, 'Não foi possível desconectar.'),
  });

  const saveTemplate = useMutation({
    mutationFn: (item: { key: WhatsappTemplateKey; body: string }) =>
      updateWhatsappTemplates(storeId!, [item]),
    onSuccess: () => {
      void invalidateTemplates();
      toast.success('Template salvo.');
    },
    onError: (error) =>
      toastClinicaMutationError(error, 'Não foi possível salvar o template.'),
  });

  return { requestQr, disconnect, saveTemplate };
}
