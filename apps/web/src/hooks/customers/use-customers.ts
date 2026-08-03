"use client";

/* SHIM (FebraHub) — mesma assinatura do use-customers da origem, alimentado
   por GET /crm/clientes (crmClientes) e mapeado para o CustomerListItem que
   os diálogos de grupo/conversa consomem (busca + paginação). */

import { useQuery } from "@tanstack/react-query";
import { crmClientes } from "@/services/api/crm";
import type { CrmClienteLista } from "@/types/crm";
import type {
  CustomerLifecycleStage,
  CustomerListItem,
  CustomerListTab,
  Paginated,
} from "@/types/api/customer";

export type CustomersQueryParams = {
  page: number;
  pageSize: number;
  search?: string;
  tab: CustomerListTab;
  lifecycleStage?: CustomerLifecycleStage;
  enabled?: boolean;
};

export const customersQueryKey = (params: Omit<CustomersQueryParams, "enabled">) =>
  ["customers", params] as const;

const ESTAGIO_PARA_ORIGEM: Record<string, CustomerLifecycleStage> = {
  lead: "lead",
  oportunidade: "opportunity",
  cliente_ativo: "active_customer",
  inativo: "inactive",
  perdido: "lost",
};

const ESTAGIO_PARA_DESTINO: Record<CustomerLifecycleStage, string> = {
  lead: "lead",
  opportunity: "oportunidade",
  active_customer: "cliente_ativo",
  inactive: "inativo",
  lost: "perdido",
};

function mapearClienteLista(c: CrmClienteLista): CustomerListItem {
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
    phone: c.telefone,
    email: c.email,
    city: c.cidade,
    products: [],
    mrrCents: 0,
    healthScore: 0,
    health: "saudavel",
    nextRenewalAt: null,
    csmName: "",
    createdAt: c.criadoEm,
  };
}

export function useCustomersQuery(params: CustomersQueryParams) {
  const { enabled = true, ...queryParams } = params;

  return useQuery({
    queryKey: customersQueryKey(queryParams),
    enabled,
    queryFn: async (): Promise<Paginated<CustomerListItem>> => {
      const resposta = await crmClientes({
        busca: queryParams.search || undefined,
        estagio: queryParams.lifecycleStage
          ? ESTAGIO_PARA_DESTINO[queryParams.lifecycleStage]
          : undefined,
        pagina: queryParams.page,
        porPagina: queryParams.pageSize,
      });
      return {
        items: resposta.itens.map(mapearClienteLista),
        total: resposta.total,
        page: resposta.pagina,
        pageSize: resposta.porPagina,
      };
    },
    placeholderData: (previousData) => previousData,
  });
}
