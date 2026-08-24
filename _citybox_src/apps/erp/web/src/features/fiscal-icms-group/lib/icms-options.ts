import type { FiscalTaxRegime } from "@/features/fiscal-settings/api/fiscal-settings.dto";

/** Alíquotas internas de ICMS vigentes por UF (spec erp/016 — pré-preenchimento). */
export const UF_INTERNAL_DEFAULTS: Record<string, number> = {
  AC: 17,
  AL: 17,
  AM: 18,
  AP: 18,
  BA: 18,
  CE: 17,
  DF: 18,
  ES: 17,
  GO: 17,
  MA: 18,
  MG: 18,
  MS: 17,
  MT: 18,
  PA: 17,
  PB: 18,
  PE: 18,
  PI: 17,
  PR: 18,
  RJ: 19,
  RN: 18,
  RO: 17,
  RR: 17,
  RS: 18,
  SC: 17,
  SE: 18,
  SP: 18,
  TO: 18,
};

/** As 27 UFs, na ordem do pré-preenchimento. */
export const UFS: string[] = Object.keys(UF_INTERNAL_DEFAULTS);

export type IcmsSituacaoOption = {
  value: string;
  label: string;
  /** `cst` = Regime Normal; `csosn` = Simples. */
  kind: "cst" | "csosn";
  disabledReason?: string;
};

/**
 * Situação do ICMS filtrada pelo regime (spec erp/016): Regime Normal → CST 00;
 * Simples → CSOSN 102/103/300/400. Os demais aparecem indisponíveis com o motivo
 * (cada CST tem grupo de XML próprio que o emissor ainda não monta).
 */
export function icmsSituacaoOptions(
  regime: FiscalTaxRegime | undefined,
): IcmsSituacaoOption[] {
  if (regime === "SIMPLES_NACIONAL") {
    return [
      { value: "102", label: "CSOSN 102 — Sem permissão de crédito", kind: "csosn" },
      { value: "103", label: "CSOSN 103 — Isenção do ICMS (faixa de receita)", kind: "csosn" },
      { value: "300", label: "CSOSN 300 — Imune", kind: "csosn" },
      { value: "400", label: "CSOSN 400 — Não tributada", kind: "csosn" },
      {
        value: "101",
        label: "CSOSN 101 — Com permissão de crédito",
        kind: "csosn",
        disabledReason: "Exige pCredSN/vCredICMSSN — fora desta versão.",
      },
      {
        value: "201",
        label: "CSOSN 201 — Com ST",
        kind: "csosn",
        disabledReason: "Exige campos de ST — fora desta versão.",
      },
    ];
  }
  // Regime Normal (Presumido/Real) e default.
  return [
    { value: "00", label: "CST 00 — Tributada integralmente", kind: "cst" },
    {
      value: "10",
      label: "CST 10 — Tributada e com cobrança de ST",
      kind: "cst",
      disabledReason: "Exige o grupo ICMS10 (ST) — fora desta versão.",
    },
    {
      value: "20",
      label: "CST 20 — Com redução de base",
      kind: "cst",
      disabledReason: "Exige o grupo ICMS20 — fora desta versão.",
    },
    {
      value: "60",
      label: "CST 60 — ICMS cobrado por ST",
      kind: "cst",
      disabledReason: "Exige o grupo ICMS60 — fora desta versão.",
    },
  ];
}

/** Só o Simples usa CSOSN; o resto usa CST. */
export function isSimplesRegime(regime: FiscalTaxRegime | undefined): boolean {
  return regime === "SIMPLES_NACIONAL";
}
