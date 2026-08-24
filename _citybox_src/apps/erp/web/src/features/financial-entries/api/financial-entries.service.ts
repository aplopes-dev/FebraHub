"use client";

import { comercioFetch, comercioUpload } from "@/lib/api/comercio-client";
import { getActiveScope } from "@/lib/api/active-scope";
import {
  toFinancialEntry,
  toFinancialEntryListItem,
  toSaveFinancialEntryPayload,
} from "@/features/financial-entries/api/financial-entry.mapper";
import type {
  FinancialEntryAttachmentDto,
  FinancialEntryDetailDto,
  FinancialEntryListResponseDto,
} from "@/features/financial-entries/api/financial-entry.dto";
import type {
  FinancialEntry,
  FinancialEntryAttachment,
  FinancialEntryListParams,
  FinancialEntryListResult,
} from "@/features/financial-entries/types/financial-entry";
import type { FinancialEntryFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";

const COMERCIO_PROXY = "/api/proxy/comercio";

function buildListQuery(params: FinancialEntryListParams): string {
  const query = new URLSearchParams();
  if (params.search.trim()) query.set("search", params.search.trim());
  if (params.filters.operations.length === 1) {
    query.set("operation", params.filters.operations[0]!);
  }
  for (const status of params.filters.statuses) query.append("status", status);
  for (const id of params.filters.categoryIds) query.append("chartOfAccountId", id);
  for (const id of params.filters.costCenterIds) query.append("costCenterId", id);
  if (params.filters.dueFrom) query.set("dueFrom", params.filters.dueFrom);
  if (params.filters.dueTo) query.set("dueTo", params.filters.dueTo);
  query.set("sort", params.sort);
  query.set("tab", params.tab);
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  return query.toString();
}

export async function listFinancialEntriesApi(
  params: FinancialEntryListParams,
): Promise<FinancialEntryListResult> {
  const res = await comercioFetch<FinancialEntryListResponseDto>(
    `/v1/financial-entries?${buildListQuery(params)}`,
  );

  return {
    data: res.data.map(toFinancialEntryListItem),
    meta: res.meta,
    tabCounts: res.tabCounts,
  };
}

export async function findFinancialEntryByIdApi(
  id: string,
): Promise<FinancialEntry> {
  const res = await comercioFetch<{ data: FinancialEntryDetailDto }>(
    `/v1/financial-entries/${id}`,
  );
  return toFinancialEntry(res.data);
}

export async function createFinancialEntryApi(
  values: FinancialEntryFormValues,
): Promise<FinancialEntry> {
  const res = await comercioFetch<{ data: FinancialEntryDetailDto }>(
    "/v1/financial-entries",
    {
      method: "POST",
      body: JSON.stringify(toSaveFinancialEntryPayload(values)),
    },
  );
  return toFinancialEntry(res.data);
}

export async function updateFinancialEntryApi(
  id: string,
  values: FinancialEntryFormValues,
): Promise<FinancialEntry> {
  const res = await comercioFetch<{ data: FinancialEntryDetailDto }>(
    `/v1/financial-entries/${id}`,
    {
      method: "PUT",
      body: JSON.stringify(toSaveFinancialEntryPayload(values)),
    },
  );
  return toFinancialEntry(res.data);
}

export async function deleteFinancialEntryApi(id: string): Promise<void> {
  await comercioFetch<void>(`/v1/financial-entries/${id}`, {
    method: "DELETE",
  });
}

export async function restoreFinancialEntryApi(
  id: string,
): Promise<FinancialEntry> {
  const res = await comercioFetch<{ data: FinancialEntryDetailDto }>(
    `/v1/financial-entries/${id}/restore`,
    { method: "POST" },
  );
  return toFinancialEntry(res.data);
}

export async function uploadFinancialEntryAttachmentApi(
  financialEntryId: string,
  file: File,
): Promise<FinancialEntryAttachment> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await comercioUpload<{ data: FinancialEntryAttachmentDto }>(
    `/v1/financial-entries/${financialEntryId}/attachments`,
    formData,
  );
  return {
    id: res.data.id,
    fileName: res.data.fileName,
    contentType: res.data.contentType,
    sizeBytes: res.data.sizeBytes,
    createdAt: res.data.createdAt,
  };
}

export async function deleteFinancialEntryAttachmentApi(
  financialEntryId: string,
  attachmentId: string,
): Promise<void> {
  await comercioFetch<void>(
    `/v1/financial-entries/${financialEntryId}/attachments/${attachmentId}`,
    { method: "DELETE" },
  );
}

/**
 * URL same-origin para baixar/abrir o anexo — igual `productImageProxyUrl`:
 * o clique num link `<a>` não manda `X-Organization-Id`, então o escopo ativo
 * vai na query e o proxy promove a header antes de chamar a API.
 */
export function financialEntryAttachmentUrl(
  financialEntryId: string,
  attachmentId: string,
): string {
  const { organizationId, branchId } = getActiveScope();
  const params = new URLSearchParams();
  if (organizationId) params.set("organizationId", organizationId);
  if (branchId) params.set("branchId", branchId);
  const query = params.toString();
  return `${COMERCIO_PROXY}/v1/financial-entries/${financialEntryId}/attachments/${attachmentId}${query ? `?${query}` : ""}`;
}
