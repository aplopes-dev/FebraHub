"use client";

import { StockMovementFormView } from "@/features/stock-movements/components/stock-movement-form-view";
import type { StockMovementType } from "@/features/stock-movements/types/stock-movement";

type StockMovementCreatePageProps = {
  initialType?: StockMovementType;
  initialWarehouseId?: string;
};

export function StockMovementCreatePage({
  initialType,
  initialWarehouseId,
}: StockMovementCreatePageProps = {}) {
  return (
    <StockMovementFormView
      initialType={initialType}
      initialWarehouseId={initialWarehouseId}
    />
  );
}
