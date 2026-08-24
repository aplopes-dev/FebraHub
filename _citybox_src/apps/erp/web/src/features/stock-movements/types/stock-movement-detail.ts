/** Tipos de detalhe/histórico usados pelo drawer (evita acoplar ao service mock). */

import type { StockMovementType } from "@/features/stock-movements/types/stock-movement";
import type { StockMovementReason } from "@/features/stock-movements/types/stock-movement-reason";

export type StockMovementLineDetail = {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  costPrice: number;
  subtotal: number;
};

export type ProductMovementLine = {
  movementId: string;
  type: StockMovementType;
  operatedAt: string;
  reason: StockMovementReason;
  categoryName: string | null;
  quantity: number;
  costPrice: number;
};
