"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getCustomerById,
  listSelectableCustomers,
  listCustomers,
} from "@/features/customers/api/customers.service";
import { customerKeys } from "@/features/customers/hooks/query-keys";
import type { CustomerListParams } from "@/features/customers/types/customer";

export function useCustomersQuery(params: CustomerListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: customerKeys.list(scope, params),
    queryFn: () => listCustomers(params),
    enabled: ready,
  });
}

export function useCustomerQuery(id: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: customerKeys.detail(scope, id),
    queryFn: () => getCustomerById(id),
    enabled: ready && Boolean(id),
    retry: false,
  });
}

/**
 * Clientes selecionáveis em outras telas (lançamentos, conciliação, vendas,
 * OS, contratos, NFS-e). **Sem filtro de estágio de CRM** — ver
 * `listSelectableCustomers` (FR-044).
 */
export function useSelectableCustomersQuery() {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: customerKeys.active(scope),
    queryFn: () => listSelectableCustomers(),
    enabled: ready,
    staleTime: 5 * 60_000,
  });
}
