import type {
  BankStatementDto,
  BankStatementTransactionDto,
  EligibleEntryDto,
  MatchCandidateDto,
} from "@/features/bank-reconciliation/api/bank-statement.dto";
import type {
  BankStatement,
  BankStatementTransaction,
  EligibleEntry,
  MatchCandidate,
} from "@/features/bank-reconciliation/types/bank-statement";

export function toBankStatement(dto: BankStatementDto): BankStatement {
  return {
    id: dto.id,
    bankAccountId: dto.bankAccountId,
    bankName: dto.bankName,
    bankCode: dto.bankCode,
    branchNumber: dto.branchNumber,
    accountNumber: dto.accountNumber,
    periodStart: dto.periodStart,
    periodEnd: dto.periodEnd,
    status: dto.status,
    counts: dto.counts,
    fileName: dto.fileName,
    createdAt: dto.createdAt,
  };
}

export function toBankStatementTransaction(
  dto: BankStatementTransactionDto,
): BankStatementTransaction {
  return {
    id: dto.id,
    postedAt: dto.postedAt,
    amount: dto.amountCents / 100,
    kind: dto.kind,
    transactionType: dto.transactionType,
    memo: dto.memo,
    status: dto.status,
    matches: dto.matches.map((match) => ({
      financialEntryId: match.financialEntryId,
      amountCents: match.amountCents,
    })),
  };
}

export function toMatchCandidate(dto: MatchCandidateDto): MatchCandidate {
  return {
    financialEntryId: dto.financialEntryId,
    openBalance: dto.openBalanceCents / 100,
    dueDate: dto.dueDate,
    description: dto.description,
    confidence: dto.confidence,
  };
}

export function toEligibleEntry(dto: EligibleEntryDto): EligibleEntry {
  return {
    financialEntryId: dto.financialEntryId,
    status: dto.status,
    eligibleAmount: dto.eligibleAmountCents / 100,
    dueDate: dto.dueDate,
    competenceDate: dto.competenceDate,
    paidAt: dto.paidAt,
    description: dto.description,
    categoryName: dto.categoryName,
  };
}
