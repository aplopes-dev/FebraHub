export type FiscalTaxRegime =
  | "SIMPLES_NACIONAL"
  | "LUCRO_PRESUMIDO"
  | "LUCRO_REAL";
export type FiscalEnvironment = "HOMOLOGATION" | "PRODUCTION";

/** Subconjunto do Emitente que a aba "Configurações gerais" lê/edita. */
export type FiscalCompanyDto = {
  id: string;
  taxRegime: FiscalTaxRegime;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  defaultEnvironment: FiscalEnvironment;
  accountingOfficeDocument: string | null;
  nationalNfseEnabled: boolean;
  /** Booleano derivado — o CSC (segredo) nunca é devolvido. */
  cscConfigured: boolean;
  /** spec erp/023, N6 — "Justificativas padrão". `null` até o lojista preencher. */
  inutilizationJustification: string | null;
  cancellationJustification: string | null;
  /** Usado para remontar o formulário (reseed) após salvar. */
  updatedAt: string;
};

export type FiscalCompanyResponseDto = { data: FiscalCompanyDto };

/** Corpo do `PATCH /v1/companies/{id}` (só os campos desta aba). */
export type UpdateFiscalCompanyPayload = {
  taxRegime: FiscalTaxRegime;
  stateRegistration: string | null;
  municipalRegistration: string | null;
  defaultEnvironment: FiscalEnvironment;
  accountingOfficeDocument: string | null;
  nationalNfseEnabled: boolean;
  inutilizationJustification: string | null;
  cancellationJustification: string | null;
};

/** Corpo do `PUT /v1/companies/{id}/csc` — write-only. */
export type SetCscPayload = {
  cscId: string;
  cscToken: string;
};
