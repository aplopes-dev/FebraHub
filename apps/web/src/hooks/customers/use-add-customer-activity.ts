"use client";

/* SHIM (FebraHub) — mesma assinatura do use-add-customer-activity da origem,
   chamando POST /crm/clientes/:id/atividades (crmCriarAtividadeCliente). */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmCriarAtividadeCliente } from "@/services/api/crm";
import { customerQueryKey } from "./use-customer";
import type { CustomerActivity } from "@/types/api/customer";

export function useAddCustomerActivityMutation(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (text: string): Promise<CustomerActivity> => {
      await crmCriarAtividadeCliente(id, text);
      return {
        id: `atividade-${Date.now()}`,
        text,
        authorName: "",
        createdAt: new Date().toISOString(),
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customerQueryKey(id) });
    },
  });
}
