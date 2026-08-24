import type {
  ProductStockMovementLineDto,
  StockBalanceItemDto,
  StockMovementDetailDto,
  StockMovementLineDto,
  StockMovementListItemDto,
} from "@/features/stock-movements/api/stock-movement.dto";
import type {
  StockMovementLineDetail,
  ProductMovementLine,
} from "@/features/stock-movements/types/stock-movement-detail";
import type { StockMovementListItem } from "@/features/stock-movements/types/stock-movement";
import type { StockBalanceItem } from "@/features/stock/types/stock-balance";
import { productImageProxyUrl } from "@/features/products/api/product-image-url";

/** Reais → centavos (arredonda para inteiro). */
export function reaisToCents(reais: number): number {
  return Math.round(Math.max(0, reais) * 100);
}

/** Centavos → reais. */
export function centsToReais(cents: number): number {
  return cents / 100;
}

/**
 * Extrai yyyy-mm-dd de ISO date ou datetime, **sempre em UTC**.
 *
 * A data da movimentação é um dia de calendário, não um instante: o formulário
 * envia `"2026-08-16"`, a API faz `new Date(...)` (meia-noite UTC) e o
 * presenter devolve `"2026-08-16T00:00:00.000Z"`. Ler esse instante com
 * getters locais (`getFullYear`/`getMonth`/`getDate`) retrocedia um dia em
 * qualquer fuso a oeste de Greenwich — em UTC−3 toda movimentação aparecia
 * como do dia anterior na lista, no drawer de detalhe e no kardex.
 */
export function toOperatedAtDate(iso: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toISOString().slice(0, 10);
}

export function toStockMovementListItem(
  dto: StockMovementListItemDto,
): StockMovementListItem {
  return {
    id: dto.id,
    type: dto.type,
    reason: dto.reason,
    categoryId: dto.categoryId,
    categoryName: dto.categoryName,
    warehouseId: dto.stockId,
    warehouseName: dto.stockName,
    operatedAt: toOperatedAtDate(dto.operatedAt),
    itemsCount: dto.itemsCount,
    totalCost: centsToReais(dto.totalCostCents),
    createdAt: dto.createdAt,
    userName: dto.userName,
    lines: [],
  };
}

export function toStockMovementLineDetail(
  line: StockMovementLineDto,
): StockMovementLineDetail {
  const quantity = Number(line.quantity);
  return {
    productId: line.productId,
    productName: line.productName,
    productSku: line.productSku,
    quantity,
    costPrice: centsToReais(line.costCents),
    subtotal: centsToReais(line.subtotalCents),
  };
}

export function toStockMovementDetailLines(
  dto: StockMovementDetailDto,
): StockMovementLineDetail[] {
  return dto.lines.map(toStockMovementLineDetail);
}

export function toProductMovementLine(
  dto: ProductStockMovementLineDto,
): ProductMovementLine {
  return {
    movementId: dto.movementId,
    type: dto.type,
    operatedAt: toOperatedAtDate(dto.operatedAt),
    reason: dto.reason,
    categoryName: dto.categoryName,
    quantity: Number(dto.quantity),
    costPrice: centsToReais(dto.costCents),
  };
}

export function toStockBalanceItem(dto: StockBalanceItemDto): StockBalanceItem {
  return {
    stockId: "",
    productId: dto.productId,
    productName: dto.productName,
    productSku: dto.productSku,
    productImageUrl: dto.hasProductImage
      ? productImageProxyUrl(dto.productId)
      : undefined,
    quantity: Number(dto.quantity),
    unit: dto.unit,
  };
}
