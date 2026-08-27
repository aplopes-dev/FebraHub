"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCarrierById,
  listCarrierOptions,
  listCarriers,
} from "@/features/carriers/api/carriers.service";
import { carrierKeys } from "@/features/carriers/hooks/query-keys";
import type { CarrierListParams } from "@/features/carriers/types/carrier";

export function useCarriersQuery(params: CarrierListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: carrierKeys.list(scope, params),
    // `ready` evita disparar antes de a empresa/unidade ativa ser resolvida —
    // sem escopo, a API responde 400.
    queryFn: () => listCarriers(params),
    enabled: ready,
  });
}

export function useCarrierQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: carrierKeys.detail(scope, id),
    queryFn: () => getCarrierById(id),
    enabled: ready && Boolean(id),
    retry: false, // 404 é resposta legítima ("transportadora não encontrada")
  });
}

/**
 * Transportadoras/entregadores ativos para selects de outras telas
 * (transferências de estoque, compras).
 */
export function useCarrierOptionsQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: carrierKeys.options(scope),
    queryFn: () => listCarrierOptions(),
    enabled: ready,
    staleTime: 5 * 60_000, // cadastro de apoio muda pouco
  });
}
