"use client";

/* SHIM (FebraHub) — mesma assinatura do use-create-customer da origem,
   chamando POST /crm/clientes (crmCriarCliente) com o mapeamento de campos
   (name→nome, personType→tipoPessoa, lifecycleStage→estagio…). */

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { crmCriarCliente } from "@/services/api/crm";
import type { EstagioCliente } from "@/types/crm";
import type {
  CreateCustomerInput,
  CreateCustomerResponse,
  CustomerLifecycleStage,
} from "@/types/api/customer";

const ESTAGIO_PARA_DESTINO: Record<CustomerLifecycleStage, EstagioCliente> = {
  lead: "lead",
  opportunity: "oportunidade",
  active_customer: "cliente_ativo",
  inactive: "inativo",
  lost: "perdido",
};

const ESTAGIO_PARA_ORIGEM: Record<string, CustomerLifecycleStage> = {
  lead: "lead",
  oportunidade: "opportunity",
  cliente_ativo: "active_customer",
  inativo: "inactive",
  perdido: "lost",
};

export function useCreateCustomerMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateCustomerInput): Promise<CreateCustomerResponse> => {
      const cliente = await crmCriarCliente({
        nome: input.name,
        tipoPessoa: input.personType,
        estagio: ESTAGIO_PARA_DESTINO[input.lifecycleStage ?? "lead"],
        documento: input.document ?? null,
        segmento: input.segment ?? null,
        telefone: input.phone || null,
        email: input.email ?? null,
        site: input.site ?? null,
        instagram: input.instagram ?? null,
      });
      return {
        id: cliente.id,
        name: cliente.nome,
        personType: cliente.tipoPessoa,
        lifecycleStage: ESTAGIO_PARA_ORIGEM[cliente.estagio] ?? "lead",
        document: cliente.documento,
        segment: cliente.segmento ?? "",
        color: "#8A6A1E",
        iconKey: "business",
        csmName: "",
        plan: "",
        mrrCents: 0,
        healthScore: 0,
        health: "saudavel",
        nextRenewalAt: null,
        customerSince: cliente.criadoEm,
      };
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}
