// Espelha a tabela de CFOP da erp-api (`operation-natures/domain/cfop.table.ts`,
// spec erp/020 FR-004) — fonte de verdade é o backend, este arquivo é só UX (o
// select nunca oferece um CFOP que o backend recusaria). Atualizar os dois juntos.

export type CfopOption = {
  code: string;
  label: string;
};

// --- ENTRADA (1xxx interna / 2xxx interestadual) — alimenta o select "De" ---
export const ENTRADA_CFOP_OPTIONS: CfopOption[] = [
  { code: "1101", label: "1101 - Compra para industrialização" },
  { code: "1102", label: "1102 - Compra para comercialização" },
  {
    code: "1111",
    label: "1111 - Compra p/ industrialização (consignação industrial)",
  },
  {
    code: "1113",
    label: "1113 - Compra p/ comercialização (consignação mercantil)",
  },
  { code: "1201", label: "1201 - Devolução de venda de produção própria" },
  { code: "1202", label: "1202 - Devolução de venda de mercadoria de terceiros" },
  { code: "2101", label: "2101 - Compra p/ industrialização (interestadual)" },
  { code: "2102", label: "2102 - Compra p/ comercialização (interestadual)" },
  {
    code: "2201",
    label: "2201 - Devolução de venda de produção própria (interestadual)",
  },
  {
    code: "2202",
    label: "2202 - Devolução de venda de mercadoria (interestadual)",
  },
];

// --- SAIDA (5xxx interna / 6xxx interestadual) — alimenta o select "Para" ---
export const SAIDA_CFOP_OPTIONS: CfopOption[] = [
  { code: "5101", label: "5101 - Venda de produção do estabelecimento" },
  { code: "5102", label: "5102 - Venda de mercadoria adquirida de terceiros" },
  { code: "5201", label: "5201 - Devolução de compra p/ industrialização" },
  { code: "5202", label: "5202 - Devolução de compra p/ comercialização" },
  {
    code: "5411",
    label: "5411 - Devolução de compra p/ comercialização (com ST)",
  },
  { code: "6101", label: "6101 - Venda de produção própria (interestadual)" },
  { code: "6102", label: "6102 - Venda de mercadoria (interestadual)" },
  { code: "6201", label: "6201 - Devolução de compra p/ industrialização (interestadual)" },
  { code: "6202", label: "6202 - Devolução de compra p/ comercialização (interestadual)" },
];

export const CFOP_LABEL: Record<string, string> = Object.fromEntries(
  [...ENTRADA_CFOP_OPTIONS, ...SAIDA_CFOP_OPTIONS].map((option) => [
    option.code,
    option.label,
  ]),
);

export type IcmsLivreCondition = "AMBOS" | "SIM" | "NAO";

export type IcmsLivreOption = {
  value: IcmsLivreCondition;
  label: string;
};

export const ICMS_LIVRE_OPTIONS: IcmsLivreOption[] = [
  { value: "AMBOS", label: "Ambos (tributado ou livre)" },
  { value: "SIM", label: "Só ICMS livre" },
  { value: "NAO", label: "Só ICMS tributado" },
];

export const ICMS_LIVRE_LABEL: Record<IcmsLivreCondition, string> = {
  AMBOS: "Ambos",
  SIM: "ICMS livre",
  NAO: "ICMS tributado",
};

export type OperationNatureGroupTaxType = "ICMS" | "PIS_COFINS";

export const GROUP_TAX_TYPE_OPTIONS: {
  value: OperationNatureGroupTaxType;
  label: string;
}[] = [
  { value: "ICMS", label: "ICMS" },
  { value: "PIS_COFINS", label: "PIS/COFINS" },
];
