"use client";

import { useQuery } from "@tanstack/react-query";
import { useCatalogScope } from "@/lib/organization-context";
import { listStockTransfersApi } from "@/features/stock-transfers/api/stock-transfers.service";
import { stockTransferKeys } from "@/features/stock-transfers/hooks/query-keys";
import type { StockTransferListParams } from "@/features/stock-transfers/types/stock-transfer";

export function useStockTransfersQuery(params: StockTransferListParams) {
  const { scope, ready } = useCatalogScope();

  return useQuery({
    queryKey: stockTransferKeys.list(scope, params),
    queryFn: () => listStockTransfersApi(params),
    enabled: ready,
  });
}
