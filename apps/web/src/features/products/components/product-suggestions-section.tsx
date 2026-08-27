"use client";

import Add from "@mui/icons-material/Add";

import { useMemo } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@/ui";
import { ProductSuggestionSortableRow } from "@/features/products/components/product-suggestion-sortable-row";
import {
  createEmptySuggestionRow,
  type ProductSuggestionRow,
} from "@/features/products/types/product-suggestions";
import { useCatalogProductsQuery } from "@/features/products/hooks/use-product-queries";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";

type ProductSuggestionsSectionProps = {
  value: ProductSuggestionRow[];
  onChange: (next: ProductSuggestionRow[]) => void;
  currentProductId?: string;
};

function updateRow(
  rows: ProductSuggestionRow[],
  rowId: string,
  next: ProductSuggestionRow,
): ProductSuggestionRow[] {
  return rows.map((row) => (row.id === rowId ? next : row));
}

export function ProductSuggestionsSection({
  value,
  onChange,
  currentProductId,
}: ProductSuggestionsSectionProps) {
  const productsQuery = useCatalogProductsQuery();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(() => value.map((item) => item.id), [value]);

  const selectedProductIds = useMemo(
    () => value.map((item) => item.productId).filter(Boolean),
    [value],
  );
  const productOptions = useMemo(
    () =>
      (productsQuery.data ?? [])
        .filter((product) => product.id !== currentProductId)
        .map((product) => ({ id: product.id, name: product.name })),
    [currentProductId, productsQuery.data],
  );

  function handleAddRow() {
    onChange([...value, createEmptySuggestionRow(value.length)]);
  }

  function handleRemoveRow(rowId: string) {
    if (value.length <= 1) {
      onChange([createEmptySuggestionRow(0)]);
      return;
    }

    onChange(
      value
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, sortOrder: index })),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.findIndex((item) => item.id === active.id);
    const newIndex = value.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(
      arrayMove(value, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    );
  }

  return (
    <Box component="section" sx={productFormSectionGridSx}>
      <Box component="header" sx={productFormSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Sugestões
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Aumente as vendas recomendando produtos relacionados que os clientes
          podem querer comprar junto.
        </Typography>
      </Box>
      <Box sx={{ ...productFormSectionBoxSx, display: "flex", flexDirection: "column", gap: 2 }}>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Aumente suas vendas sugerindo itens que costumam ser comprados juntos
          com este produto. As sugestões escolhidas serão ofertadas antes de
          seus clientes finalizarem a compra.
        </Typography>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <Box>
              {value.map((row) => (
                <ProductSuggestionSortableRow
                  key={row.id}
                  row={row}
                  options={productOptions}
                  selectedProductIds={selectedProductIds}
                  onChange={(next) => onChange(updateRow(value, row.id, next))}
                  onRemove={() => handleRemoveRow(row.id)}
                  canRemove={value.length > 1 || Boolean(row.productId)}
                />
              ))}
            </Box>
          </SortableContext>
        </DndContext>

        <Button
          type="button"
          variant="text"
          color="primary"
          onClick={handleAddRow}
          disabled={productOptions.length === 0}
          startIcon={<Add sx={{ fontSize: 16 }} />}
          sx={{ alignSelf: "flex-start", px: 0 }}
        >
          Adicionar sugestão
        </Button>
        {productsQuery.isError ? (
          <Typography variant="body2" color="error">
            Não foi possível carregar os produtos disponíveis para sugestão.
          </Typography>
        ) : null}
      </Box>
    </Box>
  );
}
