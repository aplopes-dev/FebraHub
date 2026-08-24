"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getPosCashClosingReport,
  getPosCashSaleById,
  listPosCashMovements,
  listPosCashSales,
  listPosCashSessions,
} from "@/features/pos-cash-sessions/api/pos-cash-sessions.service";
import { posCashSessionKeys } from "@/features/pos-cash-sessions/hooks/query-keys";
import { useCatalogScope } from "@/lib/organization-context";
import type {
  PosCashSaleListParams,
  PosCashSessionListParams,
} from "@/features/pos-cash-sessions/types/pos-cash-session";

export function usePosCashSessionsQuery(params: PosCashSessionListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posCashSessionKeys.list(scope, params),
    queryFn: () => listPosCashSessions(params),
    enabled: ready,
  });
}

export function usePosCashSalesQuery(
  params: PosCashSaleListParams,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posCashSessionKeys.sales(scope, params),
    queryFn: () => listPosCashSales(params),
    enabled: ready && enabled && Boolean(params.sessionId),
  });
}

export function usePosCashMovementsQuery(
  sessionId: string | null,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posCashSessionKeys.movements(scope, sessionId ?? ""),
    queryFn: () => listPosCashMovements(sessionId!),
    enabled: ready && enabled && Boolean(sessionId),
  });
}

export function usePosCashSaleQuery(
  sessionId: string | null,
  saleId: string | null,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posCashSessionKeys.sale(scope, sessionId ?? "", saleId ?? ""),
    queryFn: () => getPosCashSaleById(sessionId!, saleId!),
    enabled: ready && enabled && Boolean(sessionId) && Boolean(saleId),
  });
}

export function usePosCashClosingReportQuery(
  sessionId: string | null,
  enabled: boolean,
) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: posCashSessionKeys.closingReport(scope, sessionId ?? ""),
    queryFn: () => getPosCashClosingReport(sessionId!),
    enabled: ready && enabled && Boolean(sessionId),
  });
}
