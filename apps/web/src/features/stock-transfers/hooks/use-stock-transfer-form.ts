"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  areStockTransferFormValuesEqual,
  cloneStockTransferFormValues,
  createEmptyStockTransferFormValues,
  createTransferLine,
  normalizeNotes,
  STOCK_TRANSFER_VALIDATION_MESSAGES,
  validateStockTransferForm,
} from "@/features/stock-transfers/lib/stock-transfer-form-values";
import { useCreateStockTransferMutation } from "@/features/stock-transfers/hooks/use-stock-transfer-mutations";
import type {
  StockTransferFormValues,
  StockTransferLine,
} from "@/features/stock-transfers/types/stock-transfer";
import type { Product } from "@/features/products/types/product";

type UseStockTransferFormOptions = {
  products: Product[];
  initialWarehouses?: { fromId: string; toId: string };
  onSaved?: () => void;
};

export function useStockTransferForm({
  products,
  initialWarehouses,
  onSaved,
}: UseStockTransferFormOptions) {
  const createMutation = useCreateStockTransferMutation();

  const initial = useMemo(() => {
    const base = createEmptyStockTransferFormValues();
    if (!initialWarehouses?.fromId) return base;
    return {
      ...base,
      fromWarehouseId: initialWarehouses.fromId,
      toWarehouseId: initialWarehouses.toId,
    };
  }, [initialWarehouses]);

  const [values, setValues] = useState<StockTransferFormValues>(initial);
  const [baseline, setBaseline] = useState<StockTransferFormValues>(initial);
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  // Os depósitos só chegam depois que `useStocksQuery` resolve. Semeia apenas
  // os campos ainda vazios (não descarta o que o operador digitou), por ajuste
  // durante o render em vez de efeito — mesmo padrão de use-stock-movement-form.
  const [seededFromId, setSeededFromId] = useState<string | null>(null);
  const seedFromId = initialWarehouses?.fromId;
  if (seedFromId && seedFromId !== seededFromId) {
    setSeededFromId(seedFromId);
    const seed = (prev: StockTransferFormValues) =>
      prev.fromWarehouseId
        ? prev
        : {
            ...prev,
            fromWarehouseId: seedFromId,
            toWarehouseId: initialWarehouses?.toId ?? prev.toWarehouseId,
          };
    setValues(seed);
    setBaseline(seed);
  }

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const isDirty = useMemo(
    () => !areStockTransferFormValuesEqual(values, baseline),
    [values, baseline],
  );

  const includedIds = useMemo(
    () => new Set(values.lines.map((line) => line.productId)),
    [values.lines],
  );

  const includedProducts = useMemo(
    () =>
      values.lines
        .map((line) => productById.get(line.productId))
        .filter((product): product is Product => product != null),
    [values.lines, productById],
  );

  const getLine = useCallback(
    (productId: string): StockTransferLine | undefined =>
      values.lines.find((line) => line.productId === productId),
    [values.lines],
  );

  const setField = useCallback(
    <K extends keyof Omit<StockTransferFormValues, "lines">>(
      field: K,
      value: StockTransferFormValues[K],
    ) => {
      setValues((prev) => {
        if (field === "notes" && typeof value === "string") {
          return { ...prev, notes: normalizeNotes(value) };
        }
        return { ...prev, [field]: value };
      });
    },
    [],
  );

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

  const setBatch = useCallback((productId: string, batch: string) => {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.map((line) =>
        line.productId === productId ? { ...line, batch } : line,
      ),
    }));
  }, []);

  const addProducts = useCallback((productIds: string[]) => {
    setValues((prev) => {
      const existing = new Set(prev.lines.map((line) => line.productId));
      const additions = productIds
        .filter((id) => !existing.has(id))
        .map((id) => createTransferLine(id, 1));
      return { ...prev, lines: [...prev.lines, ...additions] };
    });
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setValues((prev) => ({
      ...prev,
      lines: prev.lines.filter((line) => line.productId !== productId),
    }));
  }, []);

  const discard = useCallback(() => {
    setValues(cloneStockTransferFormValues(baseline));
  }, [baseline]);

  const save = useCallback(async () => {
    const error = validateStockTransferForm(values);
    if (error) {
      toast.error(STOCK_TRANSFER_VALIDATION_MESSAGES[error]);
      return false;
    }

    try {
      await createMutation.mutateAsync(values);
      const snapshot = cloneStockTransferFormValues(values);
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
    setQuantity,
    setBatch,
    addProducts,
    removeProduct,
    discard,
    save,
  };
}
