"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { ComercioApiError } from "@/lib/api/comercio-client";
import {
  getPosPolicy,
  savePosPolicy,
} from "@/features/pos-policies/api/pos-policies.service";
import type { PosPolicyFormValues } from "@/features/pos-policies/types/pos-policy";

/**
 * Chave por `scope` como nas demais features. A alçada é da **organização**,
 * mas o escopo também carrega a unidade ativa — manter o mesmo formato evita
 * uma exceção que ninguém lembraria ao trocar de empresa.
 */
export const posPolicyKeys = {
  all: (scope: string) => ["comercio", "pos-policy", scope] as const,
};

function errorMessage(error: unknown): string {
  if (error instanceof ComercioApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function usePosPolicyQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posPolicyKeys.all(scope),
    queryFn: getPosPolicy,
    enabled: ready,
  });
}

export function useSavePosPolicyMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: PosPolicyFormValues) => savePosPolicy(values),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: posPolicyKeys.all(scope) });
      // Cita o PDV porque a mudança não é instantânea lá: o terminal recarrega
      // a alçada na próxima sincronização.
      toast.success("Alçadas salvas", {
        description: "Os terminais aplicam na próxima sincronização.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar as alçadas", {
        description: errorMessage(error),
      });
    },
  });
}
