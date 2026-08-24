"use client";

import { ComercioApiError, comercioFetch } from "@/lib/api/comercio-client";
import type {
  PosCashClosingReportResponseDto,
  PosCashMovementsResponseDto,
  PosCashSaleListResponseDto,
  PosCashSaleResponseDto,
  PosCashSessionListResponseDto,
  PosCashSessionResponseDto,
} from "@/features/pos-cash-sessions/api/pos-cash-session.dto";
import {
  toPosCashClosingReport,
  toPosCashMovement,
  toPosCashSale,
  toPosCashSession,
} from "@/features/pos-cash-sessions/api/pos-cash-session.mapper";
import { resolvePosCashPeriodRange } from "@/features/pos-cash-sessions/lib/pos-cash-session-period";
import type {
  PosCashClosingReport,
  PosCashMovement,
  PosCashSale,
  PosCashSaleListParams,
  PosCashSaleListResult,
  PosCashSession,
  PosCashSessionListParams,
  PosCashSessionListResult,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

function buildListQuery(params: PosCashSessionListParams): string {
  const query = new URLSearchParams();
  query.set("page", String(params.page));
  query.set("perPage", String(params.perPage));
  if (params.filters.posRegisterId.trim()) {
    query.set("posTerminalId", params.filters.posRegisterId.trim());
  }
  if (params.filters.operatorName.trim()) {
    query.set("operatorName", params.filters.operatorName.trim());
  }
  const range = resolvePosCashPeriodRange(params.filters.period);
  if (range) {
    query.set("openedFrom", range.from.toISOString());
    query.set("openedTo", range.to.toISOString());
  }
  return query.toString();
}

export async function listPosCashSessions(
  params: PosCashSessionListParams,
): Promise<PosCashSessionListResult> {
  const response = await comercioFetch<PosCashSessionListResponseDto>(
    `/v1/pos-cash-sessions?${buildListQuery(params)}`,
  );
  return {
    data: response.data.map(toPosCashSession),
    meta: response.meta,
  };
}

export async function getPosCashSessionById(
  sessionId: string,
): Promise<PosCashSession | undefined> {
  try {
    const response = await comercioFetch<PosCashSessionResponseDto>(
      `/v1/pos-cash-sessions/${sessionId}`,
    );
    return toPosCashSession(response.data);
  } catch (error) {
    if (error instanceof ComercioApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

export async function listPosCashSales(
  params: PosCashSaleListParams,
): Promise<PosCashSaleListResult> {
  const query = new URLSearchParams({
    page: String(params.page),
    perPage: String(params.perPage),
  });
  const response = await comercioFetch<PosCashSaleListResponseDto>(
    `/v1/pos-cash-sessions/${params.sessionId}/sales?${query.toString()}`,
  );
  return {
    data: response.data.map(toPosCashSale),
    meta: response.meta,
  };
}

export async function getPosCashSaleById(
  sessionId: string,
  saleId: string,
): Promise<PosCashSale | undefined> {
  try {
    const response = await comercioFetch<PosCashSaleResponseDto>(
      `/v1/pos-cash-sessions/${sessionId}/sales/${saleId}`,
    );
    return toPosCashSale(response.data);
  } catch (error) {
    if (error instanceof ComercioApiError && error.status === 404) {
      return undefined;
    }
    throw error;
  }
}

export async function listPosCashMovements(
  sessionId: string,
): Promise<PosCashMovement[]> {
  const response = await comercioFetch<PosCashMovementsResponseDto>(
    `/v1/pos-cash-sessions/${sessionId}/movements`,
  );
  return response.data.map(toPosCashMovement);
}

export async function getPosCashClosingReport(
  sessionId: string,
): Promise<PosCashClosingReport> {
  const response = await comercioFetch<PosCashClosingReportResponseDto>(
    `/v1/pos-cash-sessions/${sessionId}/closing-report`,
  );
  return toPosCashClosingReport(response.data);
}
