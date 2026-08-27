"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  amountFromPercentage,
  applyReceiveDraftsToFormValues,
  arePurchaseFormValuesEqual,
  clonePurchaseFormValues,
  createEmptyAllocation,
  createEmptyPayment,
  createEmptyPurchaseFormValues,
  createPurchaseLine,
  normalizeNotes,
  percentageFromAmount,
  PURCHASE_VALIDATION_MESSAGES,
  validatePurchaseForm,
} from "@/features/purchases/lib/purchase-form-values";
import { toSavePurchasePayload } from "@/features/purchases/api/purchase.mapper";
import {
  useCreatePurchaseMutation,
  useUpdatePurchaseMutation,
} from "@/features/purchases/hooks/use-purchase-mutations";
import type {
  PurchaseExtras,
  PurchaseFormValues,
  PurchaseLine,
  PurchaseLineStatus,
  PurchasePayment,
} from "@/features/purchases/types/purchase";
import type { Product } from "@/features/products/types/product";

type UsePurchaseFormOptions = {
  products: Product[];
  /** Quando informado, salva via update em vez de create. */
  purchaseId?: string;
  initialValues?: PurchaseFormValues;
  onSaved?: () => void;
};

export function usePurchaseForm({
  products,
  purchaseId,
  initialValues,
  onSaved,
}: UsePurchaseFormOptions) {
  const createMutation = useCreatePurchaseMutation();
  const updateMutation = useUpdatePurchaseMutation();

  const [values, setValues] = useState<PurchaseFormValues>(() =>
    initialValues
      ? clonePurchaseFormValues(initialValues)
      : createEmptyPurchaseFormValues(),
  );
  const [baseline, setBaseline] = useState<PurchaseFormValues>(() =>
    initialValues
      ? clonePurchaseFormValues(initialValues)
      : createEmptyPurchaseFormValues(),
  );
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const isDirty = useMemo(
    () => !arePurchaseFormValuesEqual(values, baseline),
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
    (productId: string): PurchaseLine | undefined =>
      values.lines.find((line) => line.productId === productId),
    [values.lines],
  );

  const setField = useCallback(
    <K extends keyof Omit<PurchaseFormValues, "lines" | "payments" | "extras">>(
      field: K,
      value: PurchaseFormValues[K],
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

  const setExtras = useCallback((extras: PurchaseExtras) => {
    setValues((prev) => ({ ...prev, extras: { ...extras } }));
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

  const setLineStatus = useCallback(
    (productId: string, status: PurchaseLineStatus) => {
      setValues((prev) => ({
        ...prev,
        lines: prev.lines.map((line) =>
          line.productId === productId ? { ...line, status } : line,
        ),
      }));
    },
    [],
  );

  /** Aplica confirmação do modal de recebimento (status + qtd por linha). */
  const applyReceiveConfirmation = useCallback(
    (
      drafts: Array<{
        productId: string;
        quantity: number;
        status: Extract<PurchaseLineStatus, "received" | "cancelled">;
      }>,
    ): PurchaseFormValues => {
      const next = applyReceiveDraftsToFormValues(values, drafts);
      setValues(next);
      return next;
    },
    [values],
  );

  const addProducts = useCallback(
    (productIds: string[]) => {
      setValues((prev) => {
        const existing = new Set(prev.lines.map((line) => line.productId));
        const additions = productIds
          .filter((id) => !existing.has(id))
          .map((id) => {
            const product = productById.get(id);
            return createPurchaseLine(id, product?.basePrice ?? 0, 1);
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

  const addPayment = useCallback(() => {
    setValues((prev) => ({
      ...prev,
      payments: [...prev.payments, createEmptyPayment()],
    }));
  }, []);

  const removePayment = useCallback((paymentId: string) => {
    setValues((prev) => {
      if (prev.payments.length <= 1) return prev;
      return {
        ...prev,
        payments: prev.payments.filter((payment) => payment.id !== paymentId),
      };
    });
  }, []);

  const updatePayment = useCallback(
    (
      paymentId: string,
      patch: Partial<Pick<PurchasePayment, "paymentMethodId" | "bankAccountId">>,
    ) => {
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId ? { ...payment, ...patch } : payment,
        ),
      }));
    },
    [],
  );

  const addAllocation = useCallback((paymentId: string) => {
    setValues((prev) => ({
      ...prev,
      payments: prev.payments.map((payment) =>
        payment.id === paymentId
          ? {
              ...payment,
              allocations: [...payment.allocations, createEmptyAllocation()],
            }
          : payment,
      ),
    }));
  }, []);

  const removeAllocation = useCallback(
    (paymentId: string, allocationId: string) => {
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) => {
          if (payment.id !== paymentId) return payment;
          if (payment.allocations.length <= 1) return payment;
          return {
            ...payment,
            allocations: payment.allocations.filter(
              (allocation) => allocation.id !== allocationId,
            ),
          };
        }),
      }));
    },
    [],
  );

  const updateAllocationField = useCallback(
    (
      paymentId: string,
      allocationId: string,
      field: "categoryId" | "costCenterId",
      value: string,
    ) => {
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                allocations: payment.allocations.map((allocation) =>
                  allocation.id === allocationId
                    ? { ...allocation, [field]: value }
                    : allocation,
                ),
              }
            : payment,
        ),
      }));
    },
    [],
  );

  const updateAllocationAmount = useCallback(
    (paymentId: string, allocationId: string, amount: number, total: number) => {
      const safeAmount = Math.max(0, amount);
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                allocations: payment.allocations.map((allocation) =>
                  allocation.id === allocationId
                    ? {
                        ...allocation,
                        amount: safeAmount,
                        percentage: percentageFromAmount(total, safeAmount),
                      }
                    : allocation,
                ),
              }
            : payment,
        ),
      }));
    },
    [],
  );

  const updateAllocationPercentage = useCallback(
    (
      paymentId: string,
      allocationId: string,
      percentage: number,
      total: number,
    ) => {
      const safePercentage = Math.min(100, Math.max(0, percentage));
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                allocations: payment.allocations.map((allocation) =>
                  allocation.id === allocationId
                    ? {
                        ...allocation,
                        percentage: safePercentage,
                        amount: amountFromPercentage(total, safePercentage),
                      }
                    : allocation,
                ),
              }
            : payment,
        ),
      }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(clonePurchaseFormValues(baseline));
  }, [baseline]);

  const save = useCallback(async (overrideValues?: PurchaseFormValues) => {
    const toSave = overrideValues ?? values;
    const error = validatePurchaseForm(toSave);
    if (error) {
      toast.error(PURCHASE_VALIDATION_MESSAGES[error]);
      return false;
    }

    const payload = toSavePurchasePayload(toSave);

    try {
      if (purchaseId) {
        await updateMutation.mutateAsync({ id: purchaseId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      const snapshot = clonePurchaseFormValues(toSave);
      setBaseline(snapshot);
      setValues(snapshot);
      setHasSavedOnce(true);
      onSaved?.();
      return true;
    } catch {
      return false;
    }
  }, [values, onSaved, purchaseId, createMutation, updateMutation]);

  return {
    values,
    isDirty,
    hasSavedOnce,
    isSaving: createMutation.isPending || updateMutation.isPending,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setExtras,
    setQuantity,
    setCostPrice,
    setLineStatus,
    applyReceiveConfirmation,
    addProducts,
    removeProduct,
    addPayment,
    removePayment,
    updatePayment,
    addAllocation,
    removeAllocation,
    updateAllocationField,
    updateAllocationAmount,
    updateAllocationPercentage,
    discard,
    save,
  };
}
