"use client";

import { apiFetch } from "@/lib/api/client";
import { fiscalFetch } from "@/lib/api/fiscal-client";
import {
  toFiscalDocumentListItem,
  toFiscalDocumentSummary,
} from "@/features/facilita-nfe/api/fiscal-document.mapper";
import type {
  FiscalCompanyListResponseDto,
  FiscalDocumentListResponseDto,
  FiscalDocumentSummaryResponseDto,
} from "@/features/facilita-nfe/api/fiscal-document.dto";
import type {
  FacilitaNfeIssuedFilters,
  FiscalDocumentListResult,
  FiscalDocumentSummary,
} from "@/features/facilita-nfe/types/fiscal-document";

/**
 * Aba "Emitido" — agora pela **API**, não pela fiscal-api direto.
 *
 * ⚠️ **Sem `companyId`, de propósito.** Antes o front resolvia o Emitente pelo
 * CNPJ e o mandava em cada request; com um realm por sistema (ADR C-16) a
 * fiscal-api deixou de conseguir validar esse vínculo, e quem o resolve passou
 * a ser a API, a partir da organização ativa do tenant. Um `companyId`
 * escolhido no browser deixaria o lojista pedir documentos de outro
 * contribuinte.
 *
 * `findFiscalCompanyByCnpjApi` abaixo continua existindo para as **outras**
 * telas fiscais (certificados, séries, NFS-e, tipo de NF do PDV, regime do
 * Emitente) — essas ainda não migraram para a API e seguem no padrão
 * anterior: `/api/proxy/fiscal` + `fiscal-client.ts`, com o isolamento entre
 * organizações garantido no próprio proxy (`lib/api/fiscal-tenant-guard.ts`,
 * 2026-08-13), não no browser. Não remover de novo sem migrar essas 6 telas
 * junto — ver `use-fiscal-company.ts`.
 */
export type ListIssuedFiscalDocumentsParams = {
  search: string;
  filters: FacilitaNfeIssuedFilters;
  page: number;
  perPage: number;
};

function buildIssuedQuery(
  params: Omit<ListIssuedFiscalDocumentsParams, "page" | "perPage">,
): URLSearchParams {
  const query = new URLSearchParams();
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.status) query.set("status", params.filters.status);
  if (params.filters.documentType) {
    query.set("documentType", params.filters.documentType);
  }
  return query;
}

/** `GET /v1/fiscal/documents` (API) — busca/paginação backend-driven. */
export async function listIssuedFiscalDocumentsApi(
  params: ListIssuedFiscalDocumentsParams,
): Promise<FiscalDocumentListResult> {
  const query = buildIssuedQuery(params);
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));

  const res = await apiFetch<FiscalDocumentListResponseDto>(
    `/v1/fiscal/documents?${query}`,
  );

  return {
    data: res.data.map(toFiscalDocumentListItem),
    meta: res.meta,
  };
}

/** Cards de totais — mesmos filtros da lista, sem paginação. */
export async function getIssuedFiscalDocumentsSummaryApi(
  params: Pick<ListIssuedFiscalDocumentsParams, "search" | "filters">,
): Promise<FiscalDocumentSummary> {
  // O summary não filtra por `status` — ele É quem calcula os buckets.
  const query = buildIssuedQuery({
    search: params.search,
    filters: { ...params.filters, status: null },
  });

  const res = await apiFetch<FiscalDocumentSummaryResponseDto>(
    `/v1/fiscal/documents/summary?${query}`,
  );

  return toFiscalDocumentSummary(res.data);
}

/**
 * Resolve o `companyId` (Emitente fiscal) a partir do CNPJ da organização
 * ativa — `GET /v1/companies?cnpj=`, endpoint já existente (research.md §2).
 * Retorna `null` quando não há Emitente cadastrado para esse CNPJ.
 */
export async function findFiscalCompanyByCnpjApi(
  cnpj: string,
): Promise<{ id: string } | null> {
  const query = new URLSearchParams({ cnpj, active: "true" });
  const res = await fiscalFetch<FiscalCompanyListResponseDto>(
    `/v1/companies?${query}`,
  );
  const company = res.data[0];
  return company ? { id: company.id } : null;
}
