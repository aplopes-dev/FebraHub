"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Sort from "@mui/icons-material/Sort";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputAdornment from "@mui/material/InputAdornment";
import { Button, CurrencyInput, MenuItem, NumberSpinner, Select } from "@citybox/mui";
import type {
  ProductAddonOption,
  ProductAddonRow,
} from "@/features/products/types/product-addons";

type ProductAddonSortableRowProps = {
  row: ProductAddonRow;
  onChange: (next: ProductAddonRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  selectedAddonIds: string[];
  options: ProductAddonOption[];
};

export function ProductAddonSortableRow({
  row,
  onChange,
  onRemove,
  canRemove,
  selectedAddonIds,
  options,
}: ProductAddonSortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: row.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  function patch(partial: Partial<ProductAddonRow>) {
    onChange({ ...row, ...partial });
  }

  const availableOptions = options.filter(
    (option) =>
      option.id === row.addonId || !selectedAddonIds.includes(option.id),
  );

  return (
    <Box ref={setNodeRef} style={style} sx={{ zIndex: isDragging ? 10 : "auto" }}>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          py: 1,
          borderRadius: isDragging ? 1 : 0,
          bgcolor: isDragging ? "action.hover" : "transparent",
          opacity: isDragging ? 0.8 : 1,
        }}
      >
        <Button
          type="button"
          variant="text"
          aria-label="Reordenar adicional"
          sx={{ minWidth: 0, p: 0.5, flexShrink: 0, cursor: "grab" }}
          {...attributes}
          {...listeners}
        >
          <Sort sx={{ fontSize: 16 }} />
        </Button>

        <FormControl sx={{ flex: 1, minWidth: 0 }}>
          <Select
            value={row.addonId || ""}
            onChange={(event) => {
              const addonId = event.target.value as string;
              const selectedOption = options.find(
                (option) => option.id === addonId,
              );
              patch({
                addonId,
                price: selectedOption?.defaultPrice ?? 0,
              });
            }}
            displayEmpty
            inputProps={{ "aria-label": "Selecionar adicional" }}
          >
            <MenuItem value="" disabled>
              Selecione uma opção
            </MenuItem>
            {availableOptions.map((option) => (
              <MenuItem key={option.id} value={option.id}>
                {option.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Box sx={{ width: 144, flexShrink: 0 }}>
          <NumberSpinner
            id={`addon-max-qty-${row.id}`}
            value={row.maxQuantity}
            min={1}
            step={1}
            onValueChange={(next) => {
              patch({
                maxQuantity:
                  next != null && Number.isFinite(next) && next >= 1 ? next : 1,
              });
            }}
          />
        </Box>

        <Box sx={{ width: { xs: 112, sm: 128 }, flexShrink: 0 }}>
          <CurrencyInput
            value={row.price}
            onValueChange={(price) => patch({ price })}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">R$</InputAdornment>
                ),
              },
            }}
            aria-label="Preço do adicional"
          />
        </Box>

        <Button
          type="button"
          variant="text"
          disabled={!canRemove}
          aria-label="Remover adicional"
          onClick={onRemove}
          sx={{ minWidth: 0, p: 0.5, flexShrink: 0 }}
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
        </Button>
      </Box>
    </Box>
  );
}
