"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import Sort from "@mui/icons-material/Sort";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import { Autocomplete, Button } from "@citybox/mui";
import type {
  ProductSuggestionOption,
  ProductSuggestionRow,
} from "@/features/products/types/product-suggestions";

type ProductSuggestionSortableRowProps = {
  row: ProductSuggestionRow;
  onChange: (next: ProductSuggestionRow) => void;
  onRemove: () => void;
  canRemove: boolean;
  selectedProductIds: string[];
  options: ProductSuggestionOption[];
};

export function ProductSuggestionSortableRow({
  row,
  onChange,
  onRemove,
  canRemove,
  selectedProductIds,
  options,
}: ProductSuggestionSortableRowProps) {
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

  const availableOptions = options.filter(
    (option) =>
      option.id === row.productId || !selectedProductIds.includes(option.id),
  );

  const selected =
    availableOptions.find((option) => option.id === row.productId) ?? null;

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
          aria-label="Reordenar sugestão"
          sx={{ minWidth: 0, p: 0.5, flexShrink: 0, cursor: "grab" }}
          {...attributes}
          {...listeners}
        >
          <Sort sx={{ fontSize: 16 }} />
        </Button>

        <Autocomplete
          id={`suggestion-select-${row.id}`}
          options={availableOptions}
          value={selected}
          onChange={(_event, next) =>
            onChange({ ...row, productId: next?.id ?? "" })
          }
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(a, b) => a.id === b.id}
          label="Produto"
          placeholder="Buscar produto…"
          noOptionsText="Nenhum produto encontrado"
          sx={{ flex: 1, minWidth: 0 }}
        />

        <Button
          type="button"
          variant="text"
          disabled={!canRemove}
          aria-label="Remover sugestão"
          onClick={onRemove}
          sx={{ minWidth: 0, p: 0.5, flexShrink: 0 }}
        >
          <DeleteOutlined sx={{ fontSize: 16 }} />
        </Button>
      </Box>
    </Box>
  );
}
