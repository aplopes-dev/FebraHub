"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@citybox/mui";
import { useCatalogScope } from "@/lib/organization-context";
import { fiscalGroupsKey } from "@/features/fiscal-default-taxes/hooks/use-fiscal-default-taxes";
import { businessErrorMessage } from "@/lib/api/business-error-message";
import {
  deleteFiscalGroupApi,
  listFiscalGroupsRichApi,
} from "../api/fiscal-groups.service";
import type { FiscalTaxType } from "../api/fiscal-groups.dto";

function richKey(scope: string, taxType: FiscalTaxType) {
  return ["comercio", "fiscal-groups-rich", scope, taxType] as const;
}

export function useFiscalGroupsRichQuery(taxType: FiscalTaxType) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: richKey(scope, taxType),
    queryFn: () => listFiscalGroupsRichApi(taxType),
    enabled: ready,
  });
}

export function useDeleteFiscalGroupMutation(taxType: FiscalTaxType) {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteFiscalGroupApi(taxType, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: richKey(scope, taxType) });
      // Chave compartilhada dos selects (padrões fiscais, naturezas de operação, NFS-e).
      queryClient.invalidateQueries({ queryKey: fiscalGroupsKey(scope) });
      toast.success("Grupo excluído.");
    },
    onError: (error) => {
      toast.error("Não foi possível excluir o grupo", {
        description: businessErrorMessage(
          error,
          "Tente novamente em instantes.",
        ),
      });
    },
  });
}
