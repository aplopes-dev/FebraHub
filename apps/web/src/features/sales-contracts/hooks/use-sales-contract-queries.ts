"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import {
  createSalesContractApi,
  deleteSalesContractApi,
  getSalesContractByIdApi,
  listContractStatusesApi,
  listSalesContractsApi,
  updateSalesContractApi,
} from "@/features/sales-contracts/api/sales-contracts.service";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type { SalesContractListParams } from "@/features/sales-contracts/types/sales-contract";
import type { Customer } from "@/features/customers/types/customer";
import { useCatalogScope } from "@/lib/organization-context";

export const salesContractKeys = {
  all: (scope: string) => ["api", "sales-contracts", scope] as const,
  list: (scope: string, params: unknown) =>
    [...salesContractKeys.all(scope), "list", params] as const,
  detail: (scope: string, id: string) =>
    [...salesContractKeys.all(scope), "detail", id] as const,
  statuses: (scope: string) =>
    [...salesContractKeys.all(scope), "statuses"] as const,
};

export function useSalesContractsQuery(params: SalesContractListParams) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: salesContractKeys.list(scope, params),
    queryFn: () => listSalesContractsApi(params),
    enabled: ready,
  });
}

export function useSalesContractQuery(id: string | undefined) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: salesContractKeys.detail(scope, id ?? ""),
    queryFn: () => getSalesContractByIdApi(id!),
    enabled: ready && Boolean(id),
  });
}

export function useContractStatusesQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: salesContractKeys.statuses(scope),
    queryFn: listContractStatusesApi,
    enabled: ready,
  });
}

export function useSalesContractMutations() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: salesContractKeys.all(scope) });

  return {
    create: useMutation({
      mutationFn: ({
        values,
        customers,
      }: {
        values: SalesContractFormValues;
        customers: readonly Customer[];
      }) => createSalesContractApi(values, customers),
      onSuccess: async () => {
        await invalidate();
        toast.success("Contrato criado.");
      },
      onError: (e: Error) => toast.error(e.message || "Erro ao criar contrato."),
    }),
    update: useMutation({
      mutationFn: ({
        id,
        values,
        customers,
      }: {
        id: string;
        values: SalesContractFormValues;
        customers: readonly Customer[];
      }) => updateSalesContractApi(id, values, customers),
      onSuccess: async () => {
        await invalidate();
        toast.success("Contrato atualizado.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao atualizar contrato."),
    }),
    remove: useMutation({
      mutationFn: deleteSalesContractApi,
      onSuccess: async () => {
        await invalidate();
        toast.success("Contrato excluído.");
      },
      onError: (e: Error) =>
        toast.error(e.message || "Erro ao excluir contrato."),
    }),
  };
}
