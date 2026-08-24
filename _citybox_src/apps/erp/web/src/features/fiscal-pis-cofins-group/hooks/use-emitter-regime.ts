"use client";

import { useQuery } from "@tanstack/react-query";
import { useFiscalCompany } from "@/features/facilita-nfe/hooks/use-fiscal-company";
import { getFiscalCompanyByIdApi } from "@/features/fiscal-settings/api/fiscal-settings.service";
import { fiscalCompanySettingsKey } from "@/features/fiscal-settings/hooks/use-fiscal-settings";
import type { FiscalTaxRegime } from "@/features/fiscal-settings/api/fiscal-settings.dto";

/**
 * Regime tributário do Emitente — usado para pré-preencher as alíquotas do grupo
 * de PIS/COFINS (spec erp/015). Mesma chave da aba "Configurações gerais".
 */
export function useEmitterRegime(): {
  regime: FiscalTaxRegime | undefined;
  isLoading: boolean;
  isError: boolean;
} {
  const {
    companyId,
    isLoading: companyLoading,
    isError: companyIsError,
  } = useFiscalCompany();
  const companyQuery = useQuery({
    queryKey: companyId
      ? fiscalCompanySettingsKey(companyId)
      : (["fiscal", "company-settings"] as const),
    queryFn: () => getFiscalCompanyByIdApi(companyId as string),
    enabled: Boolean(companyId),
  });
  return {
    regime: companyQuery.data?.taxRegime,
    // Enquanto o regime não resolve, o form de criação espera — senão o
    // pré-preenchimento de alíquota perde a janela (regime undefined → no-op).
    isLoading: companyLoading || (Boolean(companyId) && companyQuery.isLoading),
    // ⚠️ Falha ao resolver o regime NÃO pode cair no default silencioso (CST /
    // Regime Normal): um Emitente do Simples veria CSOSN errado. A tela para e avisa.
    isError: companyIsError || companyQuery.isError,
  };
}
