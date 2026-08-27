"use client";

import { apiFetch, apiUpload } from "@/lib/api/client";
import { getActiveScope } from "@/lib/api/active-scope";
import type {
  BankStatementDto,
  BankStatementListResponseDto,
  BankStatementTransactionListResponseDto,
  CreateEntryFromTransactionResponseDto,
  EligibleEntrySearchResponseDto,
  ImportBankStatementResponseDto,
  MatchSuggestionResponseDto,
} from "@/features/bank-reconciliation/api/bank-statement.dto";
import {
  toBankStatement,
  toBankStatementTransaction,
  toEligibleEntry,
  toMatchCandidate,
} from "@/features/bank-reconciliation/api/bank-statement.mapper";
import type {
  BankStatementListParams,
  BankStatementListResult,
  BankStatementTransactionListParams,
  BankStatementTransactionListResult,
  CreateEntryFromTransactionInput,
  EligibleEntrySearchFilters,
  EligibleEntrySearchResult,
  ImportBankStatementResult,
  MatchSuggestionResult,
} from "@/features/bank-reconciliation/types/bank-statement";

function buildListQuery(params: BankStatementListParams): string {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.bankAccountId) query.set("bankAccountId", params.bankAccountId);
  if (params.status) query.set("status", params.status);
  return query.toString();
}

export async function listBankStatementsApi(
  params: BankStatementListParams,
): Promise<BankStatementListResult> {
  const res = await apiFetch<BankStatementListResponseDto>(
    `/v1/bank-statements?${buildListQuery(params)}`,
  );
  return {
    data: res.data.map(toBankStatement),
    meta: { total: res.meta.total, page: res.meta.page, perPage: res.meta.perPage },
  };
}

export async function findBankStatementByIdApi(id: string) {
  const res = await apiFetch<{ data: BankStatementDto }>(
    `/v1/bank-statements/${id}`,
  );
  return toBankStatement(res.data);
}

/**
 * FR-001 / `research.md` D26 — `bankAccountId` é obrigatório. Deixou de aceitar
 * `null` (comportamento da `007-financeiro-ajustes-ui`): o arquivo OFX não
 * identifica com segurança qual conta cadastrada ele representa, então quem
 * informa é o operador.
 */
/**
 * FR-045 — exclui o extrato, suas transações e o arquivo OFX. É hard delete:
 * libera as chaves de dedupe para o arquivo poder ser reimportado. Recusado
 * (422) enquanto houver transação conciliada.
 */
export async function deleteBankStatementApi(id: string): Promise<void> {
  await apiFetch<void>(`/v1/bank-statements/${id}`, { method: "DELETE" });
}

export async function importBankStatementApi(
  bankAccountId: string,
  file: File,
): Promise<ImportBankStatementResult> {
  const formData = new FormData();
  formData.append("bankAccountId", bankAccountId);
  formData.append("file", file);
  const res = await apiUpload<ImportBankStatementResponseDto>(
    "/v1/bank-statements",
    formData,
  );
  return { data: toBankStatement(res.data), meta: res.meta };
}

export type PreviewBankStatementResult = {
  bankCode: string;
  suggestedBankAccountId: string | null;
};

/**
 * Só faz o parse do arquivo e sugere a conta bancária (FR-007a) — não
 * persiste nada. Chamada ao selecionar o arquivo no diálogo de importação,
 * antes da confirmação (`research.md` R8 da spec `007-financeiro-ajustes-ui`).
 */
export async function previewBankStatementApi(
  file: File,
): Promise<PreviewBankStatementResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiUpload<{ data: PreviewBankStatementResult }>(
    "/v1/bank-statements/preview",
    formData,
  );
  return res.data;
}

export async function listStatementTransactionsApi(
  bankStatementId: string,
  params: BankStatementTransactionListParams,
): Promise<BankStatementTransactionListResult> {
  const query = new URLSearchParams({
    status: params.status,
    page: String(params.page),
    perPage: String(params.perPage),
  });
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.postedFrom) query.set("postedFrom", params.postedFrom);
  if (params.postedTo) query.set("postedTo", params.postedTo);

  const res = await apiFetch<BankStatementTransactionListResponseDto>(
    `/v1/bank-statements/${bankStatementId}/transactions?${query.toString()}`,
  );
  return {
    data: res.data.map(toBankStatementTransaction),
    meta: { total: res.meta.total, page: res.meta.page, perPage: res.meta.perPage },
  };
}

export async function suggestMatchesApi(
  bankStatementId: string,
  transactionId: string,
): Promise<MatchSuggestionResult> {
  const res = await apiFetch<MatchSuggestionResponseDto>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/suggestions`,
  );
  if (res.kind === "none") {
    return { kind: "none", candidates: [] };
  }
  return { kind: res.kind, candidates: res.candidates.map(toMatchCandidate) };
}

export async function reconcileTransactionApi(
  bankStatementId: string,
  transactionId: string,
  financialEntryIds: string[],
): Promise<void> {
  await apiFetch<void>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/reconcile`,
    { method: "POST", body: JSON.stringify({ financialEntryIds }) },
  );
}

export async function undoReconciliationApi(
  bankStatementId: string,
  transactionId: string,
): Promise<void> {
  await apiFetch<void>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/reconcile/undo`,
    { method: "POST" },
  );
}

/** Busca lançamentos elegíveis para conciliar com uma transação — busca
 *  manual/soma unificada (US3/US4, FR-016/017/036/037/038, research.md D17).
 *  Substitui a chamada direta a `GET /v1/financial-entries`, que filtrava
 *  `status=pending` (bug relatado pelo usuário) e não excluía lançamentos já
 *  vinculados a outra transação. `bankAccountId` nunca é enviado — sempre
 *  travado no servidor na conta do extrato (FR-037). */
export async function searchEligibleEntriesApi(
  bankStatementId: string,
  transactionId: string,
  filters: EligibleEntrySearchFilters,
  page = 1,
  perPage = 20,
): Promise<EligibleEntrySearchResult> {
  const query = new URLSearchParams({
    page: String(page),
    perPage: String(perPage),
  });
  if (filters.search?.trim()) query.set("search", filters.search.trim());
  if (filters.periodFrom) query.set("periodFrom", filters.periodFrom);
  if (filters.periodTo) query.set("periodTo", filters.periodTo);
  filters.periodType?.forEach((type) => query.append("periodType", type));
  if (filters.chartOfAccountId) query.set("chartOfAccountId", filters.chartOfAccountId);
  if (filters.customerId) query.set("customerId", filters.customerId);
  if (filters.supplierId) query.set("supplierId", filters.supplierId);
  if (filters.paymentMethod) query.set("paymentMethod", filters.paymentMethod);
  if (filters.cardBrand) query.set("cardBrand", filters.cardBrand);

  const res = await apiFetch<EligibleEntrySearchResponseDto>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/eligible-entries?${query.toString()}`,
  );
  return {
    data: res.data.map(toEligibleEntry),
    meta: res.meta,
  };
}

export async function createEntryFromTransactionApi(
  bankStatementId: string,
  transactionId: string,
  input: CreateEntryFromTransactionInput,
): Promise<void> {
  await apiFetch<CreateEntryFromTransactionResponseDto>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/create-entry`,
    { method: "POST", body: JSON.stringify(input) },
  );
}

export async function discardTransactionApi(
  bankStatementId: string,
  transactionId: string,
): Promise<void> {
  await apiFetch<void>(
    `/v1/bank-statements/${bankStatementId}/transactions/${transactionId}/discard`,
    { method: "POST" },
  );
}

/**
 * URL same-origin para baixar o extrato original — igual `financialEntryAttachmentUrl`:
 * o clique num link `<a>` não manda `X-Organization-Id`, então o escopo ativo
 * vai na query e o proxy promove a header antes de chamar a API.
 */
export function bankStatementFileUrl(bankStatementId: string): string {
  const { organizationId, branchId } = getActiveScope();
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return `/api/proxy/core/v1/bank-statements/${bankStatementId}/file${query ? `?${query}` : ""}`;
}
