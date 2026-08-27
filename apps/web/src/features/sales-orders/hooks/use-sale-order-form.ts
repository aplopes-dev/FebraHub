"use client";

import { useCallback, useMemo, useState } from "react";
import { toast } from "@/ui";
import {
  areSaleOrderFormValuesEqual,
  cloneSaleOrderFormValues,
  computeSaleOrderTotal,
  createEmptyPayment,
  createEmptySaleOrderFormValues,
  createSaleOrderLine,
  normalizeNotes,
  SALE_ORDER_VALIDATION_MESSAGES,
  splitAmountEvenly,
  syncSinglePaymentAmount,
  validateSaleOrderForm,
} from "@/features/sales-orders/lib/sale-order-form-values";
import { formValuesToSavePayload } from "@/features/sales-orders/api/sale-order.mapper";
import {
  useCreateSaleOrderMutation,
  useUpdateSaleOrderMutation,
} from "@/features/sales-orders/hooks/use-sale-order-mutations";
import type {
  SaleOrderFormValues,
  SaleOrderLine,
  SaleOrderSellerOption,
} from "@/features/sales-orders/types/sale-order-form";
import type { SaleOrderStatus } from "@/features/sales-orders/types/sale-order";
import type { Product } from "@/features/products/types/product";
import type { Customer } from "@/features/customers/types/customer";
import type { PaymentMethodType } from "@/features/card-contracts/types/card-contract";

type UseSaleOrderFormOptions = {
  products: Product[];
  customers: Customer[];
  sellers: SaleOrderSellerOption[];
  /** Presente em modo de edição — dispara update via API. */
  orderId?: string;
  initialValues?: SaleOrderFormValues;
  onSaved?: () => void;
};

export function useSaleOrderForm({
  products,
  customers,
  sellers,
  orderId,
  initialValues,
  onSaved,
}: UseSaleOrderFormOptions) {
  const createMutation = useCreateSaleOrderMutation();
  const updateMutation = useUpdateSaleOrderMutation();
  const [values, setValues] = useState<SaleOrderFormValues>(() =>
    initialValues
      ? cloneSaleOrderFormValues(initialValues)
      : createEmptySaleOrderFormValues(),
  );
  const [baseline, setBaseline] = useState<SaleOrderFormValues>(() =>
    initialValues
      ? cloneSaleOrderFormValues(initialValues)
      : createEmptySaleOrderFormValues(),
  );
  const [hasSavedOnce, setHasSavedOnce] = useState(false);

  const productById = useMemo(() => {
    const map = new Map<string, Product>();
    for (const product of products) map.set(product.id, product);
    return map;
  }, [products]);

  const customerById = useMemo(() => {
    const map = new Map<string, Customer>();
    for (const customer of customers) map.set(customer.id, customer);
    return map;
  }, [customers]);

  const sellerById = useMemo(() => {
    const map = new Map<string, SaleOrderSellerOption>();
    for (const seller of sellers) map.set(seller.id, seller);
    return map;
  }, [sellers]);

  const isDirty = useMemo(
    () => !areSaleOrderFormValuesEqual(values, baseline),
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
    (productId: string): SaleOrderLine | undefined =>
      values.lines.find((line) => line.productId === productId),
    [values.lines],
  );

  const setField = useCallback(
    <
      K extends keyof Omit<
        SaleOrderFormValues,
        "lines" | "payments" | "deliveryFee" | "discounts"
      >,
    >(
      field: K,
      value: SaleOrderFormValues[K],
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

  const setStatus = useCallback((status: SaleOrderStatus) => {
    setValues((prev) => ({ ...prev, status }));
  }, []);

  const setDeliveryFee = useCallback((deliveryFee: number) => {
    setValues((prev) =>
      syncSinglePaymentAmount({
        ...prev,
        deliveryFee: Math.max(0, deliveryFee),
      }),
    );
  }, []);

  const setDiscounts = useCallback((discounts: number) => {
    setValues((prev) =>
      syncSinglePaymentAmount({
        ...prev,
        discounts: Math.max(0, discounts),
      }),
    );
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setValues((prev) =>
      syncSinglePaymentAmount({
        ...prev,
        lines: prev.lines.map((line) =>
          line.productId === productId
            ? { ...line, quantity: Math.max(0, quantity) }
            : line,
        ),
      }),
    );
  }, []);

  const setUnitPrice = useCallback((productId: string, unitPrice: number) => {
    setValues((prev) =>
      syncSinglePaymentAmount({
        ...prev,
        lines: prev.lines.map((line) =>
          line.productId === productId
            ? { ...line, unitPrice: Math.max(0, unitPrice) }
            : line,
        ),
      }),
    );
  }, []);

  const addProducts = useCallback(
    (productIds: string[]) => {
      setValues((prev) => {
        const existing = new Set(prev.lines.map((line) => line.productId));
        const additions = productIds
          .filter((id) => !existing.has(id))
          .map((id) => {
            const product = productById.get(id);
            return createSaleOrderLine(
              id,
              product?.sellPrice ?? product?.basePrice ?? 0,
              1,
            );
          });
        return syncSinglePaymentAmount({
          ...prev,
          lines: [...prev.lines, ...additions],
        });
      });
    },
    [productById],
  );

  const removeProduct = useCallback((productId: string) => {
    setValues((prev) =>
      syncSinglePaymentAmount({
        ...prev,
        lines: prev.lines.filter((line) => line.productId !== productId),
      }),
    );
  }, []);

  const addPayment = useCallback(() => {
    setValues((prev) => {
      const total = computeSaleOrderTotal(prev);
      const shares = splitAmountEvenly(total, prev.payments.length + 1);
      const rebalanced = prev.payments.map((payment, index) => ({
        ...payment,
        amount: shares[index] ?? payment.amount,
      }));
      const newPayment = createEmptyPayment({
        amount: shares[shares.length - 1] ?? 0,
      });
      return { ...prev, payments: [...rebalanced, newPayment] };
    });
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
      patch: Partial<{
        amount: number;
        paymentMethodId: string;
        bankAccountId: string;
        cardPaymentType: PaymentMethodType | undefined;
        brand: string | undefined;
        installments: number | undefined;
      }>,
    ) => {
      setValues((prev) => ({
        ...prev,
        payments: prev.payments.map((payment) =>
          payment.id === paymentId
            ? {
                ...payment,
                ...patch,
                amount:
                  patch.amount != null
                    ? Math.max(0, patch.amount)
                    : payment.amount,
              }
            : payment,
        ),
      }));
    },
    [],
  );

  const discard = useCallback(() => {
    setValues(cloneSaleOrderFormValues(baseline));
  }, [baseline]);

  const save = useCallback(async () => {
    const error = validateSaleOrderForm(values);
    if (error) {
      toast.error(SALE_ORDER_VALIDATION_MESSAGES[error]);
      return;
    }

    const seller = sellerById.get(values.sellerId);
    if (!seller) {
      toast.error(SALE_ORDER_VALIDATION_MESSAGES.missing_seller);
      return;
    }

    const customer = values.customerId
      ? customerById.get(values.customerId)
      : undefined;

    const payload = formValuesToSavePayload(
      values,
      customer?.name ?? "Consumidor final",
      seller.name,
    );

    try {
      if (orderId) {
        await updateMutation.mutateAsync({ id: orderId, payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      const nextBaseline = cloneSaleOrderFormValues(values);
      setBaseline(nextBaseline);
      setValues(nextBaseline);
      setHasSavedOnce(true);
      onSaved?.();
    } catch {
      // toast already handled by mutation onError
    }
  }, [
    values,
    sellerById,
    customerById,
    orderId,
    onSaved,
    createMutation,
    updateMutation,
  ]);

  return {
    values,
    isDirty,
    hasSavedOnce,
    isSaving: createMutation.isPending || updateMutation.isPending,
    includedIds,
    includedProducts,
    getLine,
    setField,
    setStatus,
    setDeliveryFee,
    setDiscounts,
    setQuantity,
    setUnitPrice,
    addProducts,
    removeProduct,
    addPayment,
    removePayment,
    updatePayment,
    discard,
    save,
  };
}
