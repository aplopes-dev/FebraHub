"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import { upsertFiscalParameters } from "@/features/fiscal-parameters/api/fiscal-parameters.service";
import { fiscalParameterKeys } from "@/features/fiscal-parameters/hooks/query-keys";
import type { FiscalParametersFormValues } from "@/features/fiscal-parameters/types/fiscal-parameters";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useUpsertFiscalParametersMutation(productId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: FiscalParametersFormValues) =>
      upsertFiscalParameters(productId, values),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: fiscalParameterKeys.all(scope),
      });
      toast.success("Parâmetros fiscais salvos", {
        description: "As alterações foram aplicadas ao produto.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar os parâmetros fiscais", {
        description: errorMessage(error),
      });
    },
  });
}
