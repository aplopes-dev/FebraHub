import type {
  IncomeStatementGroupDto,
  IncomeStatementReportDto,
} from "@/features/financial-results/api/financial-result.dto";
import type {
  FinancialResultReport,
  ResultGroupBlock,
} from "@/features/financial-results/types/financial-result";

function toGroupBlock(group: IncomeStatementGroupDto): ResultGroupBlock {
  return {
    groupId: group.financialGroupId,
    groupName: group.name,
    sign: group.sign,
    total: group.totalCents / 100,
    accounts: group.accounts.map((account) => ({
      accountId: account.chartOfAccountId,
      accountName: account.name,
      total: account.totalCents / 100,
    })),
  };
}

/** Converte o DTO em centavos da API no shape que a UI já consome. */
export function toFinancialResultReport(
  dto: IncomeStatementReportDto,
): FinancialResultReport {
  return {
    from: dto.from,
    to: dto.to,
    groups: dto.groups.map(toGroupBlock),
    operatingResult: dto.operatingResultCents / 100,
    entryCount: dto.entryCount,
  };
}
