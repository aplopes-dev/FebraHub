"use client";

import { useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  areSalesContractFormValuesEqual,
  cloneSalesContractFormValues,
  createEmptySalesContractFormValues,
  SALES_CONTRACT_FORM_ERROR_MESSAGES,
  validateSalesContractForm,
} from "@/features/sales-contracts/lib/sales-contract-form-values";
import { useSalesContractMutations } from "@/features/sales-contracts/hooks/use-sales-contract-queries";
import { listActiveContractStatuses } from "@/features/sales-contracts/services/contract-status.service";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type { SalesContractItem } from "@/features/sales-contracts/types/sales-contract";
import type { Product } from "@/features/products/types/product";
import type { Customer } from "@/features/customers/types/customer";

type UseSalesContractFormOptions = {
  contractId?: string;
  initialValues?: SalesContractFormValues;
  products: Product[];
  customers: Customer[];
  onSaved?: () => void;
};

export function useSalesContractForm({
  contractId,
  initialValues,
  products,
  customers,
  onSaved,
}: UseSalesContractFormOptions) {
  const mutations = useSalesContractMutations();
  const defaultStatusId = listActiveContractStatuses()[0]?.id ?? "";
  const [baseline, setBaseline] = useState<SalesContractFormValues>(() =>
    cloneSalesContractFormValues(
      initialValues ?? createEmptySalesContractFormValues(defaultStatusId),
    ),
  );
  const [values, setValues] = useState<SalesContractFormValues>(() =>
    cloneSalesContractFormValues(
      initialValues ?? createEmptySalesContractFormValues(defaultStatusId),
    ),
  );
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const isDirty = !areSalesContractFormValuesEqual(values, baseline);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const includedIds = useMemo(
    () => new Set(values.items.map((item) => item.productId)),
    [values.items],
  );

  const includedProducts = useMemo(
    () =>
      values.items
        .map((item) => productMap.get(item.productId))
        .filter((product): product is Product => Boolean(product)),
    [values.items, productMap],
  );

  function setField<K extends keyof SalesContractFormValues>(
    key: K,
    value: SalesContractFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function getLine(productId: string): SalesContractItem | undefined {
    return values.items.find((item) => item.productId === productId);
  }

  function addProducts(productIds: string[]) {
    setValues((prev) => {
      const existing = new Set(prev.items.map((item) => item.productId));
      const additions: SalesContractItem[] = [];
      for (const productId of productIds) {
        if (existing.has(productId)) continue;
        const product = productMap.get(productId);
        if (!product) continue;
        additions.push({
          productId: product.id,
          name: product.name,
          quantity: 1,
          unitPrice: product.basePrice,
        });
      }
      if (additions.length === 0) return prev;
      return { ...prev, items: [...prev.items, ...additions] };
    });
  }

  function removeProduct(productId: string) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.productId !== productId),
    }));
  }

  function setQuantity(productId: string, quantity: number) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(0, quantity) }
          : item,
      ),
    }));
  }

  function setUnitPrice(productId: string, unitPrice: number) {
    setValues((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.productId === productId
          ? { ...item, unitPrice: Math.max(0, unitPrice) }
          : item,
      ),
    }));
  }

  function discard() {
    setValues(cloneSalesContractFormValues(baseline));
  }

  function save() {
    const error = validateSalesContractForm(values);
    if (error) {
      toast.error(SALES_CONTRACT_FORM_ERROR_MESSAGES[error]);
      return;
    }

    const onSuccess = () => {
      const next = cloneSalesContractFormValues(values);
      setBaseline(next);
      setValues(next);
      setHasSavedOnce(true);
      onSaved?.();
    };

    if (contractId) {
      mutations.update.mutate(
        { id: contractId, values, customers },
        { onSuccess },
      );
      return;
    }

    mutations.create.mutate({ values, customers }, { onSuccess });
  }

  return {
    values,
    isDirty,
    hasSavedOnce,
    includedIds,
    includedProducts,
    getLine,
    setField,
    addProducts,
    removeProduct,
    setQuantity,
    setUnitPrice,
    discard,
    save,
    isSaving: mutations.create.isPending || mutations.update.isPending,
  };
}
