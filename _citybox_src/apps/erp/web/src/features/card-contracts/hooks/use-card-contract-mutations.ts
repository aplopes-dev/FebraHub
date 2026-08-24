"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  createCardContract,
  createPaymentMethod,
  deleteCardContract,
  deletePaymentMethod,
  restoreCardContract,
  updateCardContract,
  updatePaymentMethod,
} from "@/features/card-contracts/api/card-contracts.service";
import type {
  SaveCardContractPayload,
  SaveCardPaymentMethodPayload,
} from "@/features/card-contracts/api/card-contract.dto";
import { cardContractKeys } from "@/features/card-contracts/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCardContractMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCardContractPayload) =>
      createCardContract(payload),
    onSuccess: (contract) => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Contrato criado", { description: contract.provider });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o contrato", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateCardContractMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveCardContractPayload;
    }) => updateCardContract(id, payload),
    onSuccess: (contract) => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Contrato atualizado", {
        description: contract.provider,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o contrato", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteCardContractMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCardContract(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Contrato excluído", {
        description: "Ele continua disponível na aba Excluídos.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o contrato", {
        description: errorMessage(error),
      });
    },
  });
}

export function useRestoreCardContractMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => restoreCardContract(id),
    onSuccess: (contract) => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Contrato restaurado", {
        description: contract.provider,
      });
    },
    onError: (error) => {
      toast.error("Não foi possível restaurar o contrato", {
        description: errorMessage(error),
      });
    },
  });
}

export function useCreatePaymentMethodMutation(contractId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCardPaymentMethodPayload) =>
      createPaymentMethod(contractId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Método de pagamento adicionado");
    },
    onError: (error) => {
      toast.error("Não foi possível adicionar o método", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdatePaymentMethodMutation(contractId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      methodId,
      payload,
    }: {
      methodId: string;
      payload: SaveCardPaymentMethodPayload;
    }) => updatePaymentMethod(contractId, methodId, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Método de pagamento atualizado");
    },
    onError: (error) => {
      toast.error("Não foi possível atualizar o método", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeletePaymentMethodMutation(contractId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (methodId: string) =>
      deletePaymentMethod(contractId, methodId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: cardContractKeys.all(scope),
      });
      toast.success("Método de pagamento excluído");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o método", {
        description: errorMessage(error),
      });
    },
  });
}
