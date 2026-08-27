"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  getFiscalParametersByProductId,
  listFiscalParameters,
} from "@/features/fiscal-parameters/api/fiscal-parameters.service";
import { fiscalParameterKeys } from "@/features/fiscal-parameters/hooks/query-keys";
import type { FiscalParameterListParams } from "@/features/fiscal-parameters/types/fiscal-parameters";

export function useFiscalParametersListQuery(params: FiscalParameterListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: fiscalParameterKeys.list(scope, params),
    queryFn: () => listFiscalParameters(params),
    enabled: ready,
  });
}

export function useFiscalParametersDetailQuery(productId: string) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: fiscalParameterKeys.detail(scope, productId),
    queryFn: () => getFiscalParametersByProductId(productId),
    enabled: ready && Boolean(productId),
  });
}
