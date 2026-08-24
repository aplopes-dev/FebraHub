import { IPI_CST_LABEL } from "@/features/fiscal-ipi-group/lib/ipi-options";
import { PIS_COFINS_CST_OPTIONS } from "@/features/fiscal-pis-cofins-group/lib/pis-cofins-options";
import { ISSQN_TRIB_TYPE_LABEL } from "@/features/fiscal-issqn-group/lib/issqn-options";
import type { FiscalGroupTab, FiscalTaxType } from "../api/fiscal-groups.dto";

const PIS_COFINS_CST_LABEL: Record<string, string> = Object.fromEntries(
  PIS_COFINS_CST_OPTIONS.map((option) => [option.value, option.label]),
);

export const TRIBUTO_TAB_LABEL: Record<FiscalGroupTab, string> = {
  icms: "ICMS",
  ipi: "IPI",
  pis_cofins: "PIS/COFINS",
  issqn: "ISSQN",
};

/** Rota herdada por tributo — reaproveita os formulários já implementados (015/016/018/019). */
export const TRIBUTO_ROUTE: Record<FiscalGroupTab, string> = {
  icms: "/configuracoes/fiscal/grupos-icms",
  ipi: "/configuracoes/fiscal/grupos-ipi",
  pis_cofins: "/configuracoes/fiscal/grupos-pis-cofins",
  issqn: "/configuracoes/fiscal/grupos-issqn",
};

export const TRIBUTO_NEW_LABEL: Record<FiscalGroupTab, string> = {
  icms: "Novo grupo ICMS",
  ipi: "Novo grupo IPI",
  pis_cofins: "Novo grupo PIS/COFINS",
  issqn: "Novo grupo ISSQN",
};

/**
 * Rótulo de "situação tributária" a partir do código cru devolvido pela API
 * (spec erp/022, D2 — "CST/CSOSN + alíquota + nº de produtos" na listagem).
 * ICMS troca CST↔CSOSN conforme o regime, então `taxSituation` já vem
 * resolvido do backend — aqui só troca o código pelo rótulo humano.
 */
export function taxSituationLabel(
  taxType: FiscalTaxType,
  taxSituation: string | null | undefined,
): string {
  if (!taxSituation) return "—";
  switch (taxType) {
    case "ICMS":
      // CST tem 2 dígitos; CSOSN tem 3 — único jeito de distinguir sem outro campo.
      return taxSituation.length === 3
        ? `CSOSN ${taxSituation}`
        : `CST ${taxSituation}`;
    case "IPI":
      return IPI_CST_LABEL[taxSituation] ?? `CST ${taxSituation}`;
    case "PIS_COFINS":
      return PIS_COFINS_CST_LABEL[taxSituation] ?? `CST ${taxSituation}`;
    case "ISSQN":
      return ISSQN_TRIB_TYPE_LABEL[taxSituation] ?? taxSituation;
  }
}

// spec erp/023, N4: `== null` cobre `null` E `undefined` — a causa do
// "undefined%" visto em produção era o campo nem existir na resposta da API
// (deploy da erp-api atrasado, ver N2), então o `rate === null` de antes
// deixava passar batido. `null` continua legítimo (ICMS não tem alíquota
// única — vive na matriz por UF), só a checagem ficou mais defensiva.
export function rateLabel(rate: number | null | undefined): string {
  return rate == null ? "—" : `${rate}%`;
}
