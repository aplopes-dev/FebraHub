export type FiscalTaxType = "ICMS" | "IPI" | "PIS_COFINS" | "ISSQN";

/** Rota (query) usada nas abas — minúsculo/underscore, espelha o resto do Menu Fiscal. */
export type FiscalGroupTab = "icms" | "ipi" | "pis_cofins" | "issqn";

export const TAX_TYPE_BY_TAB: Record<FiscalGroupTab, FiscalTaxType> = {
  icms: "ICMS",
  ipi: "IPI",
  pis_cofins: "PIS_COFINS",
  issqn: "ISSQN",
};

export const TAB_BY_TAX_TYPE: Record<FiscalTaxType, FiscalGroupTab> = {
  ICMS: "icms",
  IPI: "ipi",
  PIS_COFINS: "pis_cofins",
  ISSQN: "issqn",
};

/**
 * Listagem unificada (spec erp/022, D1/D2) — `GET /v1/fiscal-groups?taxType=`.
 * `taxSituation`/`rate` variam por tributo (CST/CSOSN de ICMS/IPI/PIS/COFINS,
 * exigibilidade de ISSQN); `null` quando o campo não se aplica (ex.: ICMS não
 * tem uma alíquota única — vive na matriz por UF).
 */
export type FiscalGroupRichDto = {
  id: string;
  taxType: FiscalTaxType;
  name: string;
  taxSituation: string | null;
  rate: number | null;
  productCount: number;
  updatedAt: string;
};

export type FiscalGroupRichListResponseDto = { data: FiscalGroupRichDto[] };
