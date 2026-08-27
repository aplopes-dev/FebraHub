"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/ui";
import { useCatalogScope } from "@/lib/organization-context";
import { ApiError } from "@/lib/api/client";
import { productKeys } from "@/features/products/hooks/query-keys";
import { upsertTechnicalSheet } from "@/features/technical-sheets/api/technical-sheets.service";
import { technicalSheetKeys } from "@/features/technical-sheets/hooks/query-keys";
import type { TechnicalSheetFormValues } from "@/features/technical-sheets/types/technical-sheet";

function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "Erro inesperado";
}

export function useUpsertTechnicalSheetMutation(productId: string) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: {
      values: TechnicalSheetFormValues;
      applyBasePriceCents?: number;
    }) =>
      upsertTechnicalSheet(productId, input.values, {
        applyBasePriceCents: input.applyBasePriceCents,
      }),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({
        queryKey: technicalSheetKeys.all(scope),
      });
      if (variables.applyBasePriceCents !== undefined) {
        void queryClient.invalidateQueries({
          queryKey: productKeys.all(scope),
        });
      }
      toast.success("Ficha técnica salva", {
        description: "As alterações foram aplicadas ao produto.",
      });
    },
    onError: (error) => {
      toast.error("Não foi possível salvar a ficha técnica", {
        description: errorMessage(error),
      });
    },
  });
}
