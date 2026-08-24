import type {
  BankStatement,
  BankStatementStatus,
} from '../../domain/entities/bank-statement.entity';

export type ImportBankStatementDto = {
  organizationId: string;
  /**
   * **Obrigatório** desde FR-001 / `research.md` D26 (2026-08-14). Continua
   * tipado como opcional porque o use case precisa distinguir "não informou"
   * (→ `BankAccountRequiredError` ou `NoBankAccountRegisteredError`) de um id
   * inválido (→ `BankAccountNotFoundError`); a obrigatoriedade é validada lá,
   * não pelo tipo.
   *
   * Substituiu a resolução automática pelo `bankCode` da
   * `007-financeiro-ajustes-ui` FR-007a/FR-007b — o cadastro não guarda
   * agência/conta, então não havia como casar de verdade.
   */
  bankAccountId?: string | null;
  fileName: string;
  buffer: Buffer;
  importedByName?: string;
};

export type PreviewBankStatementDto = {
  organizationId: string;
  fileName: string;
  buffer: Buffer;
};

export type PreviewBankStatementResult = {
  bankCode: string;
  suggestedBankAccountId: string | null;
};

export type ImportBankStatementSummary = {
  totalInFile: number;
  imported: number;
  skippedDuplicates: number;
};

export type ImportBankStatementResult = {
  bankStatement: BankStatement;
  summary: ImportBankStatementSummary;
};

export type ListBankStatementsDto = {
  organizationId: string;
  bankAccountId?: string;
  status?: BankStatementStatus;
  page: number;
  perPage: number;
};

export type ListBankStatementsResult = {
  data: BankStatement[];
  total: number;
};

export type FindBankStatementByIdDto = {
  organizationId: string;
  id: string;
};

export type DownloadBankStatementFileDto = {
  organizationId: string;
  id: string;
};

export type DownloadBankStatementFileResult = {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
};
