"use client";

import { useMemo } from "react";
import { Autocomplete, FormField } from "@/ui";
import { FinancialEntrySection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-primitives";
import {
  listPartyOptions,
  parsePartyValue,
  type PartyComboboxOption,
} from "@/features/financial-entries/lib/financial-entry-labels";
import { useSelectableCustomersQuery } from "@/features/customers/hooks/use-customer-queries";
import { useActiveSuppliersQuery } from "@/features/suppliers/hooks/use-supplier-queries";
import type { Customer } from "@/features/customers/types/customer";
import type { Supplier } from "@/features/suppliers/types/supplier";
import type { FinancialEntryFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";

const NO_CUSTOMERS: Customer[] = [];
const NO_SUPPLIERS: Supplier[] = [];

type FinancialEntryPartySectionProps = {
  values: FinancialEntryFormValues;
  onFieldChange: <K extends keyof FinancialEntryFormValues>(
    field: K,
    value: FinancialEntryFormValues[K],
  ) => void;
  readOnly?: boolean;
};

export function FinancialEntryPartySection({
  values,
  onFieldChange,
  readOnly,
}: FinancialEntryPartySectionProps) {
  const { data: customers = NO_CUSTOMERS } = useSelectableCustomersQuery();
  const { data: suppliers = NO_SUPPLIERS } = useActiveSuppliersQuery();

  const baseOptions = useMemo(
    () => listPartyOptions(customers, suppliers),
    [customers, suppliers],
  );

  const selectedValue =
    values.partyKind && values.partyId
      ? `${values.partyKind}:${values.partyId}`
      : "";

  const options = useMemo(() => {
    if (!selectedValue) return baseOptions;
    const alreadyListed = baseOptions.some(
      (option) => option.value === selectedValue,
    );
    if (alreadyListed) return baseOptions;
    return [
      {
        value: selectedValue,
        label: values.partyName || selectedValue,
        description: "Cadastro removido",
      },
      ...baseOptions,
    ];
  }, [baseOptions, selectedValue, values.partyName]);

  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? null;

  function handlePartyChange(option: PartyComboboxOption | null) {
    if (!option) {
      onFieldChange("partyKind", null);
      onFieldChange("partyId", "");
      onFieldChange("partyName", "");
      return;
    }

    const parsed = parsePartyValue(option.value);
    if (!parsed) return;

    const name =
      parsed.kind === "customer"
        ? customers.find((customer) => customer.id === parsed.id)?.name
        : suppliers.find((supplier) => supplier.id === parsed.id)?.name;

    onFieldChange("partyKind", parsed.kind);
    onFieldChange("partyId", parsed.id);
    onFieldChange("partyName", name ?? option.label);
  }

  return (
    <FinancialEntrySection
      title="Cliente ou fornecedor"
      description="Vincule este lançamento a um cliente ou fornecedor e adicione observações, se necessário."
    >
      <Autocomplete
        label="Cliente ou fornecedor"
        options={options}
        value={selectedOption}
        onChange={(_, option) => handlePartyChange(option)}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(a, b) => a.value === b.value}
        disabled={readOnly}
        filterOptions={(opts, state) => {
          const input = state.inputValue.trim().toLowerCase();
          if (!input) return opts;
          return opts.filter(
            (option) =>
              option.label.toLowerCase().includes(input) ||
              option.description?.toLowerCase().includes(input),
          );
        }}
        renderOption={(props, option) => (
          <li {...props} key={option.value}>
            <div>
              <div>{option.label}</div>
              {option.description ? (
                <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                  {option.description}
                </div>
              ) : null}
            </div>
          </li>
        )}
        noOptionsText="Nenhum cliente ou fornecedor encontrado."
      />

      <FormField
        id="fin-note"
        label="Observação"
        value={values.note}
        onChange={(event) => onFieldChange("note", event.target.value)}
        placeholder="Informações complementares sobre este lançamento."
        multiline
        minRows={2}
        disabled={readOnly}
      />
    </FinancialEntrySection>
  );
}
