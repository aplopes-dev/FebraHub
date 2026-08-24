"use client";

import { Autocomplete } from "@citybox/mui";
import type { TechnicalSheetListItem } from "@/features/technical-sheets/types/technical-sheet";

type ProductionProductAutocompleteProps = {
  products: TechnicalSheetListItem[];
  value: string;
  onChange: (productId: string) => void;
  loading?: boolean;
  disabled?: boolean;
};

export function ProductionProductAutocomplete({
  products,
  value,
  onChange,
  loading = false,
  disabled = false,
}: ProductionProductAutocompleteProps) {
  const selected =
    products.find((product) => product.id === value) ?? null;

  return (
    <Autocomplete
      id="prod-product"
      options={products}
      value={selected}
      loading={loading}
      disabled={disabled}
      onChange={(_event, next) => {
        onChange(next?.id ?? "");
      }}
      getOptionLabel={(option) =>
        option.sku.trim()
          ? `${option.name} (${option.sku})`
          : option.name
      }
      isOptionEqualToValue={(a, b) => a.id === b.id}
      label="Produto"
      placeholder="Buscar produto…"
      noOptionsText="Nenhum produto com processo produtivo"
      fullWidth
    />
  );
}
