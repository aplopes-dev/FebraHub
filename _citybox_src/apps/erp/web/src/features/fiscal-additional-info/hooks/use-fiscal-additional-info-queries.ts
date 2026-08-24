import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import {
  countFiscalAdditionalInfosApi,
  listFiscalAdditionalInfosApi,
} from "@/features/fiscal-additional-info/api/fiscal-additional-info.service";
import { fiscalAdditionalInfoKeys } from "@/features/fiscal-additional-info/hooks/query-keys";
import type { FiscalDocumentType } from "@/features/fiscal-additional-info/lib/document-type-options";

export function useFiscalAdditionalInfosQuery(
  documentType: FiscalDocumentType,
) {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: fiscalAdditionalInfoKeys.list(scope, documentType),
    queryFn: () => listFiscalAdditionalInfosApi(documentType),
    enabled: ready,
  });
}

/** spec erp/023, N7 — usada pelo card "Informações adicionais" em Padrões fiscais. */
export function useFiscalAdditionalInfoCountsQuery() {
  const { scope, ready } = useCatalogScope();
  return useQuery({
    queryKey: fiscalAdditionalInfoKeys.count(scope),
    queryFn: countFiscalAdditionalInfosApi,
    enabled: ready,
  });
}
