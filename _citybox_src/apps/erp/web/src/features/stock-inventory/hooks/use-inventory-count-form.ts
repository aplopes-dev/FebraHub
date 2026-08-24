"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import type { InventoryLine } from "@/features/stock-inventory/types/inventory";

type BalanceSnapshot = {
  quantity: number;
  unit: string;
};

type ProductSnapshot = {
  name: string;
  sku: string;
  imageUrl?: string;
};

type UseInventoryCountFormOptions = {
  stockId: string;
  /** Saldo do depósito (productId → qty/unit) para capturar systemQuantity na UI. */
  balanceByProduct: Map<string, BalanceSnapshot>;
  /** Catálogo trackStock para nome/sku ao adicionar. */
  productsById: Map<string, ProductSnapshot>;
  onFinalize: (input: {
    stockId: string;
    name: string;
    lines: InventoryLine[];
  }) => Promise<void>;
};

export function useInventoryCountForm({
  stockId,
  balanceByProduct,
  productsById,
  onFinalize,
}: UseInventoryCountFormOptions) {
  const [name, setName] = useState("");
  const [lines, setLines] = useState<InventoryLine[]>([]);

  const includedIds = useMemo(
    () => new Set(lines.map((line) => line.productId)),
    [lines],
  );

  const isDirty = name.trim().length > 0 || lines.length > 0;

  const addProducts = useCallback(
    (productIds: string[]) => {
      setLines((prev) => {
        const existing = new Set(prev.map((line) => line.productId));
        const additions = productIds
          .filter((id) => !existing.has(id))
          .map((id): InventoryLine => {
            const balance = balanceByProduct.get(id);
            const product = productsById.get(id);
            const systemQuantity = balance?.quantity ?? 0;
            return {
              productId: id,
              systemQuantity,
              countedQuantity: systemQuantity,
              unit: balance?.unit ?? "un",
              productName: product?.name,
              productSku: product?.sku,
              productImageUrl: product?.imageUrl,
            };
          });
        return [...prev, ...additions];
      });
    },
    [balanceByProduct, productsById],
  );

  const setCounted = useCallback((productId: string, counted: number) => {
    setLines((prev) =>
      prev.map((line) =>
        line.productId === productId
          ? { ...line, countedQuantity: Math.max(0, counted) }
          : line,
      ),
    );
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setLines((prev) => prev.filter((line) => line.productId !== productId));
  }, []);

  const finalize = useCallback(async () => {
    if (!name.trim()) {
      toast.error("Informe o nome do inventário.");
      return false;
    }
    if (lines.length === 0) {
      toast.error("Adicione ao menos um produto à contagem.");
      return false;
    }

    await onFinalize({ stockId, name, lines });
    return true;
  }, [stockId, name, lines, onFinalize]);

  return {
    name,
    setName,
    lines,
    includedIds,
    isDirty,
    addProducts,
    setCounted,
    removeProduct,
    finalize,
  };
}
