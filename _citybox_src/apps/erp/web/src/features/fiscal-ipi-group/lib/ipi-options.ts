// Opções do Grupo do IPI (spec erp/019) — espelham a fonte de verdade da erp-api
// (`IPI_CST_SUPPORTED` / `IPI_ENQUADRAMENTOS`). Só CSTs de **saída**: o v1 emite
// apenas saída (tpNF '1'). Tributado (50, 99) → IPITrib (com percentual); 51–55
// → IPINT (sem percentual). O backend revalida CST e cEnq — este espelho é só UX.

export type IpiCstOption = {
  value: string;
  label: string;
  /** CST tributado (50, 99) → exige o campo Percentual. */
  tributado: boolean;
};

export const IPI_CST_OPTIONS: IpiCstOption[] = [
  { value: "50", label: "50 - Saída tributada", tributado: true },
  { value: "51", label: "51 - Saída tributada com alíquota zero", tributado: false },
  { value: "52", label: "52 - Saída isenta", tributado: false },
  { value: "53", label: "53 - Saída não-tributada", tributado: false },
  { value: "54", label: "54 - Saída imune", tributado: false },
  { value: "55", label: "55 - Saída com suspensão", tributado: false },
  { value: "99", label: "99 - Outras saídas", tributado: true },
];

export const IPI_CST_TRIBUTADO = new Set(["50", "99"]);

export function isIpiCstTributado(cst: string): boolean {
  return IPI_CST_TRIBUTADO.has(cst);
}

export const IPI_CST_LABEL: Record<string, string> = Object.fromEntries(
  IPI_CST_OPTIONS.map((option) => [option.value, option.label]),
);

export type IpiEnquadramentoOption = {
  value: string;
  label: string;
};

// Espelha `IPI_ENQUADRAMENTOS` da erp-api (subconjunto curado + 999 padrão).
export const IPI_ENQUADRAMENTO_OPTIONS: IpiEnquadramentoOption[] = [
  { value: "999", label: "999 - Tributação normal do IPI" },
  { value: "101", label: "101 - Imunidade: livros, jornais e periódicos" },
  { value: "102", label: "102 - Imunidade: produtos destinados à exportação" },
  { value: "103", label: "103 - Imunidade: ouro ativo financeiro" },
  { value: "104", label: "104 - Imunidade: energia, combustíveis e minerais" },
  { value: "201", label: "201 - Isenção: instituições de educação/assistência" },
  { value: "301", label: "301 - Suspensão: industrialização por encomenda" },
];
