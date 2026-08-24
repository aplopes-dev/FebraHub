"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@citybox/mui";
import {
  areStockMovementFormValuesEqual,
  cloneStockMovementFormValues,
  createEmptyStockMovementFormValues,
  STOCK_MOVEMENT_VALIDATION_MESSAGES,
  validateStockMovementForm,
} from "@/features/stock-movements/lib/stock-movement-form-values";
import { useCreateStockMovementMutation } from "@/features/stock-movements/hooks/use-stock-movement-mutations";
import type {
  StockMovementFormValues,
  StockMovementLine,
  StockMovementType,
} from "@/features/stock-movements/types/stock-movement";
import type { Product } from "@/features/products/types/product";

type UseStockMovementFormOptions = {
  products: Product[];
  /** Saldo por productId no depósito selecionado. */
  balanceByProductId?: ReadonlyMap<string, number>;
  initialType?: StockMovementType;
  initialWarehouseId?: string;
  onSaved?: () => void;
};

export function useStockMovementForm({
  products,
  balanceByProductId,
  initialType,
  initialWarehouseId,
  onSaved,
}: UseStockMovementFormOptions) {
  const createMutation = useCreateStockMovementMutation();

  const initial = useMemo(
    () =>
      createEmptyStockMovementFormValues({
        type: initialType,
        warehouseId: initialWarehouseId,
      }),
    [initialType, initialWarehouseId],
  );
  const [values, setValues] = useState<StockMovementFormValues>(initial);
  const [baseline, setBaseline] = useState<StockMovementFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // O depósito só chega depois que `useStocksQuery` resolve (o atalho
  // "Registrar saída" passa o id por query string, mas o form o valida contra
  // a lista carregada). Reatribuir `initial` inteiro aqui descartava tudo que
  // o operador já tinha digitado — categoria, data e produtos sumiam 1-2 s
  // depois, sem aviso.
  //
  // Semeia apenas o campo ainda vazio, e por ajuste durante o render em vez de
  // efeito (padrão React para "prop mudou", já usado em financial-statement).
  const [seededWarehouseId, setSeededWarehouseId] = useState<string | null>(
    null,
  );
  if (initialWarehouseId && initialWarehouseId !== seededWarehouseId) {
    setSeededWarehouseId(initialWarehouseId);
    const seed = (prev: StockMovementFormValues) =>
      prev.warehouseId ? prev : { ...prev, warehouseId: initialWarehouseId };
    setValues(seed);
    setBaseline(seed);
  }

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const isDirty = useMemo(
    () => !areStockMovementFormValuesEqual(values, baseline),
    [values, baseline],
  );

  const includedIds = useMemo(
    () => new Set(values.lines.map((line) => line.productId)),
    [values.lines],
  );

  const includedProducts = useMemo(
    () =>
      values.lines
        .map((line) => {
          const product = productById.get(line.productId);
          if (!product) return null;
          const balance = balanceByProductId?.get(product.id);
          return {
            ...product,
            stock: balance ?? product.stock,
          };
        })
        .filter((product): product is Product => product != null),
    [values.lines, productById, balanceByProductId],
  );

  const getLine = useCallback(
    (productId: string): StockMovementLine | undefined =>
      values.lines.find((line) => line.productId === productId),
    [values.lines],
  );

  const setField = useCallback(
    <K extends keyof Omit<StockMovementFormValues, "lines">>(
      field: K,
      value: StockMovementFormValues[K],
    ) => {
      setValues((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setType = useCallback((type: StockMovementType) => {
    setValues((prev) => ({ ...prev, type, categoryId: "" }));
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.productId === productId
          ? { ...line, quantity: Math.max(0, quantity) }
          : line,
      ),
    }));
  }, []);

  const setCostPrice = useCallback((productId: string, costPrice: number) => {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.productId === productId
          ? { ...line, costPrice: Math.max(0, costPrice) }
          : line,
      ),
    }));
  }, []);

  const addProducts = useCallback(
    (productIds: string[]) => {
      setValues((prev) => {
        const existing = new Set(prev.lines.map((line) => line.productId));
        const additions = productIds
          .filter((id) => !existing.has(id))
          .map((id) => {
            const product = productById.get(id);
            return {
              productId: id,
              quantity: 1,
              costPrice: product?.basePrice ?? 0,
            };
          });
        return { ...prev, lines: [...prev.lines, ...additions] };
      });
    },
    [productById],
  );

  const removeProduct = useCallback((productId: string) => {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.productId !== productId),
    }));
  }, []);

  const discard = useCallback(() => {
    setValues(cloneStockMovementFormValues(baseline));
  }, [baseline]);

  const save = useCallback(async () => {
    const error = validateStockMovementForm(values);
    if (error) {
      toast.error(STOCK_MOVEMENT_VALIDATION_MESSAGES[error]);
      return false;
    }

    try {
      await createMutation.mutateAsync(values);
      const snapshot = cloneStockMovementFormValues(values);
      setBaseline(snapshot);
      setValues(snapshot);
      setHasSavedOnce(true);
      onSaved?.();
      return true;
    } catch {
      return false;
    }
  }, [values, onSaved, createMutation]);

  return {
    values,
    isDirty,
    hasSavedOnce,
    isSaving: createMutation.isPending,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setType,
    setQuantity,
    setCostPrice,
    addProducts,
    removeProduct,
    discard,
    save,
  };
}
