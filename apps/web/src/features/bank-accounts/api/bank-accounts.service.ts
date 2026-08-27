"use client";

import { apiFetch } from "@/lib/api/client";
import type {
  BankAccount,
  BankAccountFormValues,
  BankAccountListItem,
  BankAccountListParams,
  BankAccountListResult,
  BankAccountStatementParams,
  BankAccountStatementResult,
  BankAccountTransactionsParams,
  BankAccountTransactionsResult,
  BankTransaction,
} from "@/features/bank-accounts/types/bank-account";
import type { BankAccountOption } from "@/lib/option-types";
import { getBankNameByCode } from "@/features/bank-accounts/lib/bank-catalog";

type BankAccountDto = {
  id: string;
  name: string;
  bankName: string;
  bankCode: string;
  openingBalanceCents: number;
  currentBalanceCents: number;
  openedAt: string;
  branchIds: string[];
  deletedAt: string | null;
  createdAt: string;
};

type BankTransactionDto = {
  id: string;
  kind: BankTransaction["kind"];
  description: string;
  amountCents: number;
  effectiveAt: string;
  sourceType: BankTransaction["sourceType"];
  createdByName: string;
  createdAt: string;
};

function toBankAccount(dto: BankAccountDto): BankAccount {
  return {
    id: dto.id,
    name: dto.name,
    bankCode: dto.bankCode,
    bankName: dto.bankName || getBankNameByCode(dto.bankCode),
    openedAt: dto.openedAt.slice(0, 10),
    initialBalance: dto.openingBalanceCents / 100,
    currentBalance: dto.currentBalanceCents / 100,
    unitIds: dto.branchIds,
  };
}

function toBankTransaction(dto: BankTransactionDto): BankTransaction {
  return {
    id: dto.id,
    kind: dto.kind,
    description: dto.description,
    amount: dto.amountCents / 100,
    sourceType: dto.sourceType,
    createdByName: dto.createdByName,
    effectiveAt: dto.effectiveAt,
    createdAt: dto.createdAt,
  };
}

export async function listBankAccountsApi(
  params: BankAccountListParams,
): Promise<BankAccountListResult> {
  const query = new URLSearchParams({
    tab: "active",
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.search.trim()) query.set("search", params.search.trim());

  const res = await apiFetch<{
    data: BankAccountDto[];
    meta: BankAccountListResult["meta"];
  }>(`/v1/bank-accounts?${query}`);

  return {
    data: res.data.map(toBankAccount),
    meta: res.meta,
  };
}

/** Opções para selects de recebimento/pagamento — só contas vivas. */
export async function listBankAccountOptionsApi(): Promise<BankAccountOption[]> {
  const res = await apiFetch<{ data: BankAccountDto[] }>(
    "/v1/bank-accounts?perPage=100&tab=active",
  );
  return res.data.map((dto) => ({ id: dto.id, name: dto.name }));
}

export async function findBankAccountByIdApi(id: string): Promise<BankAccount> {
  const res = await apiFetch<{ data: BankAccountDto }>(
    `/v1/bank-accounts/${id}`,
  );
  return toBankAccount(res.data);
}

type BankAccountWritablePayload = {
  name: string;
  bankName?: string;
  bankCode?: string;
  openingBalanceCents?: number;
  openedAt: string;
  branchIds?: string[];
};

function toWritablePayload(
  values: BankAccountFormValues,
): BankAccountWritablePayload {
  return {
    name: values.name.trim() || getBankNameByCode(values.bankCode),
    bankName: getBankNameByCode(values.bankCode),
    bankCode: values.bankCode,
    openingBalanceCents: Math.round(values.initialBalance * 100),
    openedAt: values.openedAt,
    branchIds: values.unitIds,
  };
}

export async function createBankAccountApi(
  values: BankAccountFormValues,
): Promise<BankAccount> {
  const res = await apiFetch<{ data: BankAccountDto }>(
    "/v1/bank-accounts",
    {
      method: "POST",
      body: JSON.stringify(toWritablePayload(values)),
    },
  );
  return toBankAccount(res.data);
}

export async function updateBankAccountApi(
  id: string,
  values: BankAccountFormValues,
): Promise<BankAccount> {
  const res = await apiFetch<{ data: BankAccountDto }>(
    `/v1/bank-accounts/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toWritablePayload(values)),
    },
  );
  return toBankAccount(res.data);
}

/** Aba Transações (US3) — analítica, filtrável por tipo/período. */
export async function listBankAccountTransactionsApi(
  accountId: string,
  params: BankAccountTransactionsParams,
): Promise<BankAccountTransactionsResult> {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.kind) query.set("kind", params.kind);
  if (params.effectiveFrom) query.set("effectiveFrom", params.effectiveFrom);
  if (params.effectiveTo) query.set("effectiveTo", params.effectiveTo);

  const res = await apiFetch<{
    data: BankTransactionDto[];
    meta: BankAccountTransactionsResult["meta"];
  }>(`/v1/bank-accounts/${accountId}/transactions?${query}`);

  return { data: res.data.map(toBankTransaction), meta: res.meta };
}

/** Aba Histórico (US2) — extrato com saldo acumulado correto entre páginas. */
export async function listBankAccountStatementApi(
  accountId: string,
  params: BankAccountStatementParams,
): Promise<BankAccountStatementResult> {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage),
  });

  const res = await apiFetch<{
    data: Array<{ transaction: BankTransactionDto; runningBalanceCents: number }>;
    meta: BankAccountStatementResult["meta"];
  }>(`/v1/bank-accounts/${accountId}/statement?${query}`);

  return {
    data: res.data.map((entry) => ({
      transaction: toBankTransaction(entry.transaction),
      runningBalance: entry.runningBalanceCents / 100,
    })),
    meta: res.meta,
  };
}

/** US4 — transferência transacional entre 2 contas da organização. */
export async function createBankTransferApi(input: {
  fromBankAccountId: string;
  toBankAccountId: string;
  amountCents: number;
  effectiveAt: string;
  paymentMethod: string;
  costCenterId: string;
  description?: string;
}): Promise<void> {
  await apiFetch("/v1/bank-transfers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export type { BankAccountListItem };
