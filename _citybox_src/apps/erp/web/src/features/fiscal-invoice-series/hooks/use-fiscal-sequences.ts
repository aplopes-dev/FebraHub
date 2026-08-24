"use client";

import { useQuery } from "@tanstack/react-query";
import { listFiscalSequencesApi } from "../api/fiscal-sequence.service";
import { fiscalSequenceKeys } from "./query-keys";
import type { FiscalEnvironment } from "../api/fiscal-sequence.dto";

/** Lista as séries do Emitente para o ambiente selecionado (US1). */
export function useFiscalSequences(
  companyId: string | null,
  environment: FiscalEnvironment,
) {
  return useQuery({
    queryKey: companyId
      ? fiscalSequenceKeys.list(companyId, environment)
      : fiscalSequenceKeys.all,
    enabled: Boolean(companyId),
    queryFn: () => listFiscalSequencesApi(companyId as string, environment),
  });
}
