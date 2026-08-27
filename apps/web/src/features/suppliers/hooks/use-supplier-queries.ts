"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getSupplierById,
  listActiveSuppliers,
  listSuppliers,
} from "@/features/suppliers/api/suppliers.service";
import { supplierKeys } from "@/features/suppliers/hooks/query-keys";
import type { SupplierListParams } from "@/features/suppliers/types/supplier";

export function useSuppliersQuery(params: SupplierListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: supplierKeys.list(scope, params),
    // `ready` evita disparar antes de a empresa/unidade ativa ser resolvida —
    // sem escopo, a API responde 400.
    queryFn: () => listSuppliers(params),
    enabled: ready,
  });
}

export function useSupplierQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: supplierKeys.detail(scope, id),
    queryFn: () => getSupplierById(id),
    enabled: ready && Boolean(id),
    retry: false, // 404 é resposta legítima ("fornecedor não encontrado")
  });
}

/** Fornecedores ativos para selects de outras telas. */
export function useActiveSuppliersQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: supplierKeys.active(scope),
    queryFn: () => listActiveSuppliers(),
    enabled: ready,
    staleTime: 5 * 60_000, // cadastro de apoio muda pouco
  });
}
