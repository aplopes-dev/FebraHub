import type {
  BankStatementStatus,
  BankStatementTransactionKind,
  BankStatementTransactionStatus,
} from "@/features/bank-reconciliation/types/bank-statement";

export type BankStatementDto = {
  id: string;
  bankAccountId: string;
  bankName: string;
  bankCode: string;
  branchNumber: string;
  accountNumber: string;
  periodStart: string;
  periodEnd: string;
  status: BankStatementStatus;
  counts: { pending: number; reconciled: number; discarded: number };
  fileName: string;
  createdAt: string;
};

export type BankStatementListResponseDto = {
  data: BankStatementDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

export type ImportBankStatementResponseDto = {
  data: BankStatementDto;
  meta: { totalInFile: number; imported: number; skippedDuplicates: number };
};

export type BankStatementTransactionDto = {
  id: string;
  postedAt: string;
  amountCents: number;
  kind: BankStatementTransactionKind;
  transactionType: string;
  memo: string;
  status: BankStatementTransactionStatus;
  matches: Array<{ financialEntryId: string; amountCents: number }>;
};

export type BankStatementTransactionListResponseDto = {
  data: BankStatementTransactionDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

export type MatchCandidateDto = {
  financialEntryId: string;
  openBalanceCents: number;
  dueDate: string;
  description: string;
  confidence: number;
};

export type MatchSuggestionResponseDto = {
  kind: "exact" | "value_divergence" | "none";
  candidates: MatchCandidateDto[];
};

/** Item de `GET .../eligible-entries` (FR-038, research.md D17). */
export type EligibleEntryDto = {
  financialEntryId: string;
  status: "pending" | "paid";
  eligibleAmountCents: number;
  dueDate: string;
  competenceDate: string;
  paidAt: string | null;
  description: string;
  categoryName: string;
};

export type EligibleEntrySearchResponseDto = {
  data: EligibleEntryDto[];
  meta: { total: number; page: number; perPage: number; totalPages: number };
};

export type CreateEntryFromTransactionResponseDto = {
  data: { id: string };
};
