"use client";

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
import Add from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Button, NumberInput } from "@/ui";
import { ComponentSortableRow } from "@/features/technical-sheets/components/component-sortable-row";
import { createEmptyComponentRow } from "@/features/technical-sheets/lib/technical-sheet-form-values";
import {
  compositionCol,
  compositionRowMinWidth,
  formCompositionSectionGridSx,
  formSectionBoxSx,
  formSectionHeaderSx,
} from "@/features/technical-sheets/lib/technical-sheet-form-styles";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { CompositionComponentRow } from "@/features/technical-sheets/types/technical-sheet";

type ProductCompositionSectionProps = {
  components: CompositionComponentRow[];
  maxRemovableComponents: number;
  componentOptions: CompositionComponentOption[];
  onComponentsChange: (next: CompositionComponentRow[]) => void;
  onMaxRemovableChange: (next: number) => void;
};

const MAX_REMOVE_TOOLTIP =
  "Número máximo de componentes que o cliente pode remover do produto ao pedir.";

export function ProductCompositionSection({
  components,
  maxRemovableComponents,
  componentOptions,
  onComponentsChange,
  onMaxRemovableChange,
}: ProductCompositionSectionProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(
    () => components.map((item) => item.id),
    [components],
  );
  const selectedComponentIds = useMemo(
    () => components.map((item) => item.componentId).filter(Boolean),
    [components],
  );

  function handleAddEmptyRow() {
    onComponentsChange([
      ...components,
      createEmptyComponentRow(components.length),
    ]);
  }

  function handleRemoveRow(rowId: string) {
    if (components.length <= 1) {
      onComponentsChange([createEmptyComponentRow(0)]);
      return;
    }
    onComponentsChange(
      components
        .filter((row) => row.id !== rowId)
        .map((row, index) => ({ ...row, sortOrder: index })),
    );
  }

  function handleRowChange(rowId: string, next: CompositionComponentRow) {
    onComponentsChange(
      components.map((row) => (row.id === rowId ? next : row)),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = components.findIndex((item) => item.id === active.id);
    const newIndex = components.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    onComponentsChange(
      arrayMove(components, oldIndex, newIndex).map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    );
  }

  function clampMaxRemovable(value: number): number {
    return Number.isFinite(value) && value >= 0 ? value : 0;
  }

  return (
    <Box component="section" sx={formCompositionSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography
          component="h2"
          variant="subtitle1"
          sx={{ fontWeight: 600 }}
        >
          Composição do produto
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          Selecione e quantifique os insumos/ingredientes base que compõem este
          produto e suas regras de remoção.
        </Typography>
      </Box>
      <Box sx={formSectionBoxSx}>
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: compositionRowMinWidth }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: compositionCol.gap,
                mb: 1.5,
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
              <Box
                sx={{
                  width: compositionCol.optional,
                  flexShrink: 0,
                  textAlign: "center",
                }}
              >
                Opcional
              </Box>
              <Box sx={{ width: compositionCol.quantity, flexShrink: 0, mr: 0.5 }}>
                Quantidade
              </Box>
              <Box
                sx={{
                  width: compositionCol.unitCost,
                  flexShrink: 0,
                  display: { xs: "none", md: "block" },
                  ml: 0.5,
                }}
              >
                Custo unitário
              </Box>
              <Box sx={{ width: compositionCol.total, flexShrink: 0 }}>
                Custo total
              </Box>
              <Box sx={{ width: compositionCol.remove, flexShrink: 0 }} aria-hidden />
            </Box>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={itemIds}
                strategy={verticalListSortingStrategy}
              >
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {components.map((row) => (
                    <ComponentSortableRow
                      key={row.id}
                      row={row}
                      componentOptions={componentOptions}
                      selectedComponentIds={selectedComponentIds}
                      onChange={(next) => handleRowChange(row.id, next)}
                      onRemove={() => handleRemoveRow(row.id)}
                      canRemove={
                        components.length > 1 ||
                        Boolean(row.componentId) ||
                        row.quantity !== 1 ||
                        row.unitCost > 0
                      }
                    />
                  ))}
                </Box>
              </SortableContext>
            </DndContext>
          </Box>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{
            mt: 2,
            alignItems: { xs: "stretch", sm: "center" },
            justifyContent: "space-between",
          }}
        >
          <Button
            type="button"
            variant="text"
            onClick={handleAddEmptyRow}
            startIcon={<Add sx={{ fontSize: 16 }} />}
            sx={{
              textTransform: "none",
              fontWeight: 600,
              px: 1,
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          >
            Adicionar linha vazia
          </Button>
          <Tooltip title={MAX_REMOVE_TOOLTIP} placement="top" arrow>
            <Box
              sx={{
                width: { xs: "100%", sm: 168 },
                flexShrink: 0,
                cursor: "help",
              }}
            >
              <NumberInput
                id="max-removable"
                label="Remoções máximas"
                value={maxRemovableComponents}
                minValue={0}
                step={1}
                onValueChange={(next) =>
                  onMaxRemovableChange(clampMaxRemovable(next))
                }
                aria-label="Máximo de componentes a remover"
                sx={{ width: "100%" }}
              />
            </Box>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}
