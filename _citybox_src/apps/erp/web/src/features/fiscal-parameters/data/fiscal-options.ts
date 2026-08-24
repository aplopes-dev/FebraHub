import type { FiscalOption } from "@/features/fiscal-parameters/types/fiscal-parameters";

export const NCM_OPTIONS: FiscalOption[] = [
  { value: "00000000", label: "00000000 — Item genérico" },
  { value: "6109.10.00", label: "6109.10.00 — Camisetas de algodão" },
  { value: "6203.42.00", label: "6203.42.00 — Calças de algodão" },
  { value: "3304.99.90", label: "3304.99.90 — Cosméticos e maquiagem" },
  { value: "7323.99.00", label: "7323.99.00 — Utensílios de cozinha" },
  { value: "2106.90.90", label: "2106.90.90 — Preparações alimentícias" },
];

export const ORIGIN_OPTIONS: FiscalOption[] = [
  { value: "0", label: "0 — Nacional" },
  { value: "1", label: "1 — Estrangeira (importação direta)" },
  { value: "2", label: "2 — Estrangeira (mercado interno)" },
  { value: "3", label: "3 — Nacional (conteúdo importado 40%–70%)" },
];

export const CEST_OPTIONS: FiscalOption[] = [
  { value: "none", label: "Sem CEST" },
  { value: "01.001.00", label: "01.001.00 — Autopeças" },
  { value: "20.064.00", label: "20.064.00 — Cosméticos e perfumaria" },
  { value: "28.001.00", label: "28.001.00 — Venda de mercadorias porta a porta" },
];

export const CST_IBS_CBS_OPTIONS: FiscalOption[] = [
  { value: "000", label: "000 — Tributação integral" },
  { value: "010", label: "010 — Alíquota reduzida" },
  { value: "200", label: "200 — Isenção" },
  { value: "400", label: "400 — Não tributado" },
];

export const TAX_CLASSIFICATION_OPTIONS: FiscalOption[] = [
  { value: "000001", label: "000001 — Regra geral" },
  { value: "000010", label: "000010 — Alimentos da cesta básica" },
  { value: "000200", label: "000200 — Produtos com isenção" },
  { value: "000320", label: "000320 — Redução de base de cálculo" },
];

export const ICMS_OPTIONS: FiscalOption[] = [
  { value: "icms-00", label: "ICMS 00 — Tributada integralmente" },
  { value: "icms-20", label: "ICMS 20 — Com redução de base de cálculo" },
  { value: "icms-60", label: "ICMS 60 — ST cobrado anteriormente" },
  { value: "icms-102", label: "ICMS 102 — Simples Nacional sem crédito" },
];

export const PIS_COFINS_OPTIONS: FiscalOption[] = [
  { value: "pc-01", label: "PIS/COFINS 01 — Operação tributável (alíquota básica)" },
  { value: "pc-04", label: "PIS/COFINS 04 — Monofásica (revenda alíquota zero)" },
  { value: "pc-06", label: "PIS/COFINS 06 — Alíquota zero" },
  { value: "pc-07", label: "PIS/COFINS 07 — Operação isenta" },
];

export const IPI_OPTIONS: FiscalOption[] = [
  { value: "ipi-53", label: "IPI 53 — Saída não tributada" },
  { value: "ipi-52", label: "IPI 52 — Saída isenta" },
  { value: "ipi-50", label: "IPI 50 — Saída tributada" },
  { value: "ipi-99", label: "IPI 99 — Outras saídas" },
];

export const CFOP_OPTIONS: FiscalOption[] = [
  {
    value: "5102",
    label: "5102 — Venda de mercadoria adquirida de terceiros (dentro do estado)",
  },
  {
    value: "6102",
    label: "6102 — Venda de mercadoria adquirida de terceiros (fora do estado)",
  },
  { value: "5405", label: "5405 — Venda de mercadoria com ST (dentro do estado)" },
  { value: "5405-out", label: "5401 — Venda de produção do estabelecimento com ST" },
];

/**
 * Tributação do ISSQN na NFS-e (LC 116 / NFS-e nacional). Situações padrão de
 * exigibilidade — a alíquota em si é municipal e configurada no grupo fiscal.
 */
export const ISSQN_OPTIONS: FiscalOption[] = [
  { value: "1", label: "1 — Exigível" },
  { value: "2", label: "2 — Não incidência" },
  { value: "3", label: "3 — Isenção" },
  { value: "4", label: "4 — Exportação" },
  { value: "5", label: "5 — Imunidade" },
  { value: "6", label: "6 — Exigibilidade suspensa (decisão judicial)" },
  { value: "7", label: "7 — Exigibilidade suspensa (processo administrativo)" },
];
