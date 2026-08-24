"use client";

import Add from "@mui/icons-material/Add";

import { useMemo } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { Button } from "@citybox/mui";
import { ComponentSortableRow } from "@/features/technical-sheets/components/component-sortable-row";
import { createEmptyComponentRow } from "@/features/technical-sheets/lib/technical-sheet-form-values";
import {
  compositionCol,
  compositionRowMinWidth,
} from "@/features/technical-sheets/lib/technical-sheet-form-styles";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { CompositionComponentRow } from "@/features/technical-sheets/types/technical-sheet";

type ComponentListEditorProps = {
  components: CompositionComponentRow[];
  componentOptions: CompositionComponentOption[];
  onChange: (next: CompositionComponentRow[]) => void;
  addLabel?: string;
  emptyLabel?: string;
};

export function ComponentListEditor({
  components,
  componentOptions,
  onChange,
  addLabel = "Adicionar componente",
  emptyLabel = "Nenhum componente adicionado.",
}: ComponentListEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemIds = useMemo(() => components.map((item) => item.id), [components]);
  const selectedComponentIds = useMemo(() => components.map((item) => item.componentId).filter(Boolean), [components]);

  function handleAddRow() { onChange([...components, createEmptyComponentRow(components.length)]); }

  function handleRemoveRow(rowId: string) {
    onChange(components.filter((row) => row.id !== rowId).map((row, index) => ({ ...row, sortOrder: index })));
  }

  function handleRowChange(rowId: string, next: CompositionComponentRow) {
    onChange(components.map((row) => (row.id === rowId ? next : row)));
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = components.findIndex((item) => item.id === active.id);
    const newIndex = components.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onChange(arrayMove(components, oldIndex, newIndex).map((item, index) => ({ ...item, sortOrder: index })));
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
      {components.length > 0 ? (
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: compositionRowMinWidth }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: compositionCol.gap,
                px: 0.5,
                fontSize: "0.725rem",
                fontWeight: 600,
                color: "text.secondary",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              <Box sx={{ width: compositionCol.handle, flexShrink: 0 }} aria-hidden />
              <Box
                sx={{
                  minWidth: compositionCol.insumoMin,
                  flex: `1 1 ${compositionCol.insumoMin}px`,
                }}
              >
                Insumo
              </Box>
              <Box sx={{ width: compositionCol.optional, flexShrink: 0, textAlign: "center" }}>
                Opcional
              </Box>
              <Box sx={{ width: compositionCol.quantity, flexShrink: 0 }}>Quantidade</Box>
              <Box
                sx={{
                  width: compositionCol.unitCost,
                  flexShrink: 0,
                  display: { xs: "none", md: "block" },
                }}
              >
                Custo unitário
              </Box>
              <Box sx={{ width: compositionCol.total, flexShrink: 0 }}>Custo total</Box>
              <Box sx={{ width: compositionCol.remove, flexShrink: 0 }} aria-hidden />
            </Box>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
                <Box>
                  {components.map((row) => (
                    <ComponentSortableRow
                      key={row.id}
                      row={row}
                      componentOptions={componentOptions}
                      selectedComponentIds={selectedComponentIds}
                      onChange={(next) => handleRowChange(row.id, next)}
                      onRemove={() => handleRemoveRow(row.id)}
                      canRemove
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
        </Box>
      ) : (
        <Typography
          variant="body2"
          sx={{
            color: "text.secondary",
            py: 1,
          }}
        >
          {emptyLabel}
        </Typography>
      )}
      <Button
        type="button"
        variant="text"
        onClick={handleAddRow}
        startIcon={<Add sx={{ fontSize: 16 }} />}
        sx={{ textTransform: "none", fontWeight: 500, alignSelf: "flex-start" }}
      >
        {addLabel}
      </Button>
    </Box>
  );
}
