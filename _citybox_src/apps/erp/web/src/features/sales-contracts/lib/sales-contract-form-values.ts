import {
  parseIsoDate,
  toIsoDate,
} from "@/features/sales-orders/lib/sale-order-form-values";
import { computeContractTotal } from "@/features/sales-contracts/lib/sales-contract-recurrence";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type {
  RecurrenceDuration,
  SalesContract,
  SalesContractItem,
} from "@/features/sales-contracts/types/sales-contract";

export { parseIsoDate, toIsoDate };

function todayIsoDate(): string {
  return toIsoDate(new Date());
}

export function createEmptySalesContractFormValues(
  defaultStatusId = "",
): SalesContractFormValues {
  const today = todayIsoDate();
  return {
    customerId: "",
    sellerId: "",
    startDate: today,
    endIndefinite: true,
    endDate: "",
    statusId: defaultStatusId,
    statusDetail: "",
    notes: "",
    items: [],
    firstDueDate: today,
    frequency: "monthly",
    durationMode: "forever",
    durationUntilDate: "",
    durationTimes: 12,
    paymentMethodId: "",
  };
}

export function cloneSalesContractFormValues(
  values: SalesContractFormValues,
): SalesContractFormValues {
  return {
    ...values,
    items: values.items.map((item) => ({ ...item })),
  };
}

export function areSalesContractFormValuesEqual(
  a: SalesContractFormValues,
  b: SalesContractFormValues,
): boolean {
  if (
    a.customerId !== b.customerId ||
    a.sellerId !== b.sellerId ||
    a.startDate !== b.startDate ||
    a.endIndefinite !== b.endIndefinite ||
    a.endDate !== b.endDate ||
    a.statusId !== b.statusId ||
    a.statusDetail !== b.statusDetail ||
    a.notes !== b.notes ||
    a.firstDueDate !== b.firstDueDate ||
    a.frequency !== b.frequency ||
    a.durationMode !== b.durationMode ||
    a.durationUntilDate !== b.durationUntilDate ||
    a.durationTimes !== b.durationTimes ||
    a.paymentMethodId !== b.paymentMethodId ||
    a.items.length !== b.items.length
  ) {
    return false;
  }

  return a.items.every((item, index) => {
    const other = b.items[index];
    return (
      other != null &&
      item.productId === other.productId &&
      item.name === other.name &&
      item.quantity === other.quantity &&
      item.unitPrice === other.unitPrice
    );
  });
}

export function durationFromFormValues(
  values: SalesContractFormValues,
): RecurrenceDuration {
  if (values.durationMode === "until_date") {
    return { mode: "until_date", untilDate: values.durationUntilDate };
  }
  if (values.durationMode === "times") {
    return { mode: "times", times: values.durationTimes };
  }
  return { mode: "forever" };
}

export function contractToFormValues(
  contract: SalesContract,
): SalesContractFormValues {
  const duration = contract.duration;
  return {
    customerId: contract.customerId,
    sellerId: contract.sellerId,
    startDate: contract.startDate,
    endIndefinite: contract.endDate == null,
    endDate: contract.endDate ?? "",
    statusId: contract.statusId,
    statusDetail: contract.statusDetail,
    notes: contract.notes,
    items: contract.items.map((item) => ({ ...item })),
    firstDueDate: contract.firstDueDate,
    frequency: contract.frequency,
    durationMode: duration.mode,
    durationUntilDate:
      duration.mode === "until_date" ? duration.untilDate : "",
    durationTimes: duration.mode === "times" ? duration.times : 12,
    paymentMethodId: contract.paymentMethodId,
  };
}

export type SalesContractFormError =
  | "missing_customer"
  | "missing_seller"
  | "missing_start_date"
  | "missing_end_date"
  | "missing_status"
  | "missing_items"
  | "invalid_item"
  | "missing_first_due"
  | "missing_payment_method"
  | "missing_until_date"
  | "invalid_times";

export const SALES_CONTRACT_FORM_ERROR_MESSAGES: Record<
  SalesContractFormError,
  string
> = {
  missing_customer: "Selecione o cliente.",
  missing_seller: "Selecione o vendedor.",
  missing_start_date: "Informe a data de início.",
  missing_end_date: "Informe a data de término ou marque como indefinido.",
  missing_status: "Selecione o status do contrato.",
  missing_items: "Adicione ao menos um produto ou serviço.",
  invalid_item: "Informe quantidade e valor válidos para todos os itens.",
  missing_first_due: "Informe o primeiro vencimento.",
  missing_payment_method: "Selecione a forma de pagamento.",
  missing_until_date: "Informe a data limite das cobranças.",
  invalid_times: "Informe a quantidade de parcelas (mínimo 1).",
};

export function validateSalesContractForm(
  values: SalesContractFormValues,
): SalesContractFormError | null {
  if (!values.customerId) return "missing_customer";
  if (!values.sellerId) return "missing_seller";
  if (!values.startDate) return "missing_start_date";
  if (!values.endIndefinite && !values.endDate) return "missing_end_date";
  if (!values.statusId) return "missing_status";
  if (values.items.length === 0) return "missing_items";
  if (
    values.items.some(
      (item) => item.quantity <= 0 || item.unitPrice < 0 || !item.productId,
    )
  ) {
    return "invalid_item";
  }
  if (!values.firstDueDate) return "missing_first_due";
  if (!values.paymentMethodId) return "missing_payment_method";
  if (values.durationMode === "until_date" && !values.durationUntilDate) {
    return "missing_until_date";
  }
  if (
    values.durationMode === "times" &&
    (!Number.isFinite(values.durationTimes) || values.durationTimes < 1)
  ) {
    return "invalid_times";
  }
  return null;
}

export function computeFormTotal(items: SalesContractItem[]): number {
  return computeContractTotal(items);
}
