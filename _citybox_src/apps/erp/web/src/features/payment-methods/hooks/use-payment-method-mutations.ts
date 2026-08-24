"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createPaymentMethodApi,
  deletePaymentMethodApi,
  updatePaymentMethodApi,
} from "@/features/payment-methods/api/payment-methods.service";
import type { SavePaymentMethodPayload } from "@/features/payment-methods/api/payment-method.dto";
import { paymentMethodKeys } from "@/features/payment-methods/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreatePaymentMethodMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SavePaymentMethodPayload) =>
      createPaymentMethodApi(payload),
    onSuccess: (paymentMethod) => {
      void queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.all(scope),
      });
      toast.success("Forma de pagamento criada", {
        description: paymentMethod.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível criar a forma de pagamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePaymentMethodMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SavePaymentMethodPayload;
    }) => updatePaymentMethodApi(id, payload),
    onSuccess: (paymentMethod) => {
      void queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.all(scope),
      });
      toast.success("Forma de pagamento atualizada", {
        description: paymentMethod.name,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar a forma de pagamento", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePaymentMethodMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePaymentMethodApi(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: paymentMethodKeys.all(scope),
      });
      toast.success("Forma de pagamento excluída");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir a forma de pagamento", {
        description: errorMessage(error),
      });
    },
  });
}
