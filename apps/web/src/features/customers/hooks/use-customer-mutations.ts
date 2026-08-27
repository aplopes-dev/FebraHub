"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import {
  createCustomer,
  deleteCustomer,
  updateCustomer,
} from "@/features/customers/api/customers.service";
import type { SaveCustomerPayload } from "@/features/customers/api/customer.dto";
import { customerKeys } from "@/features/customers/hooks/query-keys";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useCreateCustomerMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SaveCustomerPayload) => createCustomer(payload),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all(scope) });
      toast.success("Cliente criado", { description: customer.name });
    },
    onError: (error) => {
      toast.error("Não foi possível criar o cliente", {
        description: errorMessage(error),
      });
    },
  });
}

export function useUpdateCustomerMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: SaveCustomerPayload;
    }) => updateCustomer(id, payload),
    onSuccess: (customer) => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all(scope) });
      toast.success("Cliente salvo", { description: customer.name });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar o cliente", {
        description: errorMessage(error),
      });
    },
  });
}

export function useDeleteCustomerMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerKeys.all(scope) });
      toast.success("Cliente excluído");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o cliente", {
        description: errorMessage(error),
      });
    },
  });
}
