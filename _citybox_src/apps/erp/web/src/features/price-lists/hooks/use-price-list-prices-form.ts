"use client";

import { useCallback, useMemo, useState } from "react";
import { computeAdjustedPrice } from "@/features/price-lists/lib/price-list-adjustment";
import {
  applyBulkOperation,
  areItemPricesEqual,
} from "@/features/price-lists/lib/price-list-form-values";
import { useReplacePriceListItemsMutation } from "@/features/price-lists/hooks/use-price-list-mutations";
import type {
  BulkPriceOperation,
  PriceList,
  PriceListItemPrice,
} from "@/features/price-lists/types/price-list";
import type { Product } from "@/features/products/types/product";

type UsePriceListPricesFormOptions = {
  list: PriceList;
  products: Product[];
  initialItems: PriceListItemPrice[];
};

function cloneItems(items: PriceListItemPrice[]): PriceListItemPrice[] {
  return items.map((item) => ({ ...item }));
}

export function usePriceListPricesForm({
  list,
  products,
  initialItems,
}: UsePriceListPricesFormOptions) {
  const [items, setItems] = useState(() => cloneItems(initialItems));
  const [baseline, setBaseline] = useState(() => cloneItems(initialItems));
  const [hasSavedOnce, setHasSavedOnce] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const replaceMutation = useReplacePriceListItemsMutation(list.id);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const priceByProductId = useMemo(() => {
    const map = new Map<string, number>();
    for (const item of items) map.set(item.productId, item.price);
    return map;
  }, [items]);

  const includedProducts = useMemo(
    () =>
      items
        .map((item) => productById.get(item.productId))
        .filter((product): product is Product => product != null),
    [items, productById],
  );

  const includedIds = useMemo(
    () => new Set(items.map((item) => item.productId)),
    [items],
  );

  const isDirty = useMemo(
    () => !areItemPricesEqual(items, baseline),
    [items, baseline],
  );

  const getPrice = useCallback(
    (productId: string): number => priceByProductId.get(productId) ?? 0,
    [priceByProductId],
  );

  const setPrice = useCallback((productId: string, price: number) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, price: Math.max(0, price) }
          : item,
      ),
    );
  }, []);

  const addProducts = useCallback(
    (productIds: string[]) => {
      setItems((prev) => {
        const existing = new Set(prev.map((item) => item.productId));
        const additions = productIds
          .filter((id) => !existing.has(id))
          .map((id) => {
            const product = productById.get(id);
            const base = product?.basePrice ?? 0;
            return { productId: id, price: computeAdjustedPrice(base, list) };
          });
        return [...prev, ...additions];
      });
    },
    [productById, list],
  );

  const removeProducts = useCallback((productIds: string[]) => {
    const removing = new Set(productIds);
    setItems((prev) => prev.filter((item) => !removing.has(item.productId)));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of productIds) next.delete(id);
      return next;
    });
  }, []);

  const toggleSelect = useCallback((productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      const allSelected =
        includedProducts.length > 0 &&
        includedProducts.every((product) => prev.has(product.id));
      if (allSelected) return new Set();
      return new Set(includedProducts.map((product) => product.id));
    });
  }, [includedProducts]);

  const clearSelection = useCallback(() => setSelectedIds(new Set()), []);

  const applyBulk = useCallback(
    (operation: BulkPriceOperation, value: number) => {
      setItems((prev) =>
        prev.map((item) =>
          selectedIds.has(item.productId)
            ? { ...item, price: applyBulkOperation(item.price, operation, value) }
            : item,
        ),
      );
    },
    [selectedIds],
  );

  const discard = useCallback(() => {
    setItems(cloneItems(baseline));
    setSelectedIds(new Set());
  }, [baseline]);

  const save = useCallback(async () => {
    const saved = await replaceMutation.mutateAsync(items);
    setItems(cloneItems(saved));
    setBaseline(cloneItems(saved));
    setHasSavedOnce(true);
  }, [items, replaceMutation]);

  return {
    includedProducts,
    includedIds,
    getPrice,
    setPrice,
    addProducts,
    removeProducts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    clearSelection,
    applyBulk,
    isDirty,
    hasSavedOnce,
    discard,
    save,
    isSaving: replaceMutation.isPending,
  };
}
