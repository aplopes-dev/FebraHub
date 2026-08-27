"use client";

/* SHIM (FebraHub) — mesma assinatura do use-customer da origem, alimentado
   por GET /crm/clientes/:id (crmCliente) e mapeado para o CustomerDetail
   que o painel de contexto consome (name, segment, phone, …). */

import { useQuery } from "@tanstack/react-query";
import { crmCliente } from "@/services/api/crm";
import type { CrmClienteDetalhe } from "@/types/crm";
import type {
  CustomerDetail,
  CustomerLifecycleStage,
} from "@/types/api/customer";

export const customerQueryKey = (id: string) => ["customers", "detail", id] as const;

const ESTAGIO_PARA_ORIGEM: Record<string, CustomerLifecycleStage> = {
  lead: "lead",
  oportunidade: "opportunity",
  cliente_ativo: "active_customer",
  inativo: "inactive",
  perdido: "lost",
};

export function mapearClienteDetalhe(c: CrmClienteDetalhe): CustomerDetail {
  return {
    id: c.id,
    name: c.nome,
    personType: c.tipoPessoa,
    lifecycleStage: ESTAGIO_PARA_ORIGEM[c.estagio] ?? "lead",
    document: c.documento,
    segment: c.segmento ?? "",
    color: "#8A6A1E",
    iconKey: "business",
    logoUrl: null,
    site: c.site,
    instagram: c.instagram,
    phone: c.telefone,
    email: c.email,
    street: null,
    neighborhood: null,
    city: c.cidade,
    zipCode: null,
    complement: null,
    csmName: "",
    plan: "",
    mrrCents: 0,
    healthScore: 0,
    health: "saudavel",
    nextRenewalAt: null,
    customerSince: c.criadoEm,
    summary: {
      mrrCents: 0,
      nextRenewalAt: null,
      healthScore: 0,
      openDealsCount: c.negocios?.filter((n) => !n.fechadoEm).length ?? 0,
      openPipelineCents: 0,
      wonRevenueCents: 0,
    },
    contacts: (c.contatos ?? []).map((contato) => ({
      id: contato.id,
      name: contato.nome,
      role: contato.cargo ?? "",
      email: contato.email ?? "",
      phone: contato.telefone ?? "",
      isPrimary: contato.principal,
    })),
    products: [],
    onboarding: null,
    tickets: [],
    npsResponses: [],
    files: [],
    activities: (c.atividades ?? []).map((atividade) => ({
      id: atividade.id,
      text: atividade.texto,
      authorName: "",
      createdAt: atividade.criadoEm,
    })),
  };
}

export function useCustomerQuery(id: string) {
  return useQuery({
    queryKey: customerQueryKey(id),
    queryFn: async () => mapearClienteDetalhe(await crmCliente(id)),
    enabled: Boolean(id),
    retry: (failureCount, error) => {
      const status = (error as { statusCode?: number }).statusCode;
      if (status === 404) return false;
      return failureCount < 2;
    },
  });
}
