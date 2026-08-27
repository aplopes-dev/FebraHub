"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { createBankTransferApi } from "@/features/bank-accounts/api/bank-accounts.service";
import { bankAccountKeys } from "@/features/bank-accounts/hooks/query-keys";

export type CreateBankTransferInput = {
  fromBankAccountId: string;
  toBankAccountId: string;
  amountCents: number;
  effectiveAt: string;
  paymentMethod: string;
  costCenterId: string;
  description?: string;
};

/**
 * Invalida o prefixo inteiro de `bank-accounts` (lista, detalhe, transações,
 * extrato de ambas as contas) — mais simples e seguro que invalidar cada
 * conta envolvida individualmente, e o custo de recarregar a lista inteira é
 * desprezível no volume desta ferramenta.
 */
export function useCreateBankTransferMutation() {
  const { scope } = useCatalogScope();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createBankTransferApi,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: bankAccountKeys.all(scope) });
    },
  });
}
