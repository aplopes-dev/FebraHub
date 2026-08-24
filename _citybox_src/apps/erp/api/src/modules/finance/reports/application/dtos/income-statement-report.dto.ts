import type { FinancialGroupSign } from '../../../financial-groups/domain/entities/financial-group.entity';

export type GetIncomeStatementInput = {
  organizationId: string;
  from: Date;
  to: Date;
};

export type IncomeStatementAccountDto = {
  chartOfAccountId: string;
  name: string;
  totalCents: number;
};

export type IncomeStatementGroupDto = {
  financialGroupId: string;
  name: string;
  sign: FinancialGroupSign;
  totalCents: number;
  accounts: IncomeStatementAccountDto[];
};

/**
 * Substitui a forma binária `revenue`/`expense` anterior (spec
 * `007-financeiro-ajustes-ui` US5) — `groups` é sempre os 9 grupos fixos do
 * modelo, na ordem do catálogo, mesmo com `totalCents: 0`.
 */
export type IncomeStatementReportDto = {
  from: string;
  to: string;
  groups: IncomeStatementGroupDto[];
  operatingResultCents: number;
  entryCount: number;
};
