export type FinancialResultPeriodPreset =
  | "current_month"
  | "last_month"
  | "last_3_months"
  | "current_year"
  | "custom";

export type FinancialResultPeriod = {
  preset: FinancialResultPeriodPreset;
  customFrom: string | null;
  customTo: string | null;
};

/**
 * Lançamento pela **data de competência** (quando a receita/despesa ocorreu),
 * que é a base do relatório — não a data de pagamento.
 */
export type ResultEntry = {
  id: string;
  accountId: string;
  competenceDate: string;
  amount: number;
  description: string;
};

export type ResultAccountLine = {
  accountId: string;
  accountName: string;
  total: number;
};

/** Grupo financeiro do modelo fixo de 9 categorias — `sign` decide o efeito no resultado. */
export type ResultGroupBlock = {
  groupId: string;
  groupName: string;
  sign: "positive" | "negative";
  total: number;
  accounts: ResultAccountLine[];
};

/**
 * DRE reestruturada (spec `007-financeiro-ajustes-ui` US5) — `groups` é
 * sempre os 9 grupos fixos do modelo, na ordem do catálogo (mesmo com
 * `total: 0`), terminando em "Resultado Operacional" (`operatingResult`).
 * Substitui a forma binária `revenue`/`expense` anterior.
 */
export type FinancialResultReport = {
  from: string;
  to: string;
  groups: ResultGroupBlock[];
  operatingResult: number;
  entryCount: number;
};
