import type { Customer } from "@/features/customers/types/customer";
import type { Supplier } from "@/features/suppliers/types/supplier";
import type { FinancialEntryPartyKind } from "@/features/financial-entries/types/financial-entry";

export type PartyComboboxOption = {
  /** Formato `customer:<id>` ou `supplier:<id>` — combina os dois cadastros num único select. */
  value: string;
  label: string;
  description?: string;
};

/**
 * Opções combinadas de Cliente + Fornecedor para o `Autocomplete` do
 * lançamento — clientes e fornecedores vêm ambos da API real
 * (`useSelectableCustomersQuery`/`useActiveSuppliersQuery`).
 */
export function listPartyOptions(
  customers: readonly Customer[],
  suppliers: readonly Supplier[],
): PartyComboboxOption[] {
  const customerOptions: PartyComboboxOption[] = customers.map((customer) => ({
    value: `customer:${customer.id}`,
    label: customer.name,
    description: "Cliente",
  }));
  const supplierOptions: PartyComboboxOption[] = suppliers.map((supplier) => ({
    value: `supplier:${supplier.id}`,
    label: supplier.name,
    description: "Fornecedor",
  }));
  return [...customerOptions, ...supplierOptions];
}

/** Decompõe o `value` combinado (`customer:<id>`) em kind + id. */
export function parsePartyValue(
  value: string,
): { kind: FinancialEntryPartyKind; id: string } | null {
  const [kind, id] = value.split(":");
  if ((kind === "customer" || kind === "supplier") && id) {
    return { kind, id };
  }
  return null;
}
