"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import DragIndicator from "@mui/icons-material/DragIndicator";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import { Autocomplete, Button, Checkbox, CurrencyInput, NumberInput } from "@citybox/mui";
import { useDecimalPlacesByAbbreviation } from "@/features/unit-of-measure/hooks/use-unit-of-measure-queries";
import { computeRowTotal, formatCurrency } from "@/features/technical-sheets/lib/technical-sheet-cost";
import { compositionCol } from "@/features/technical-sheets/lib/technical-sheet-form-styles";
import type { CompositionComponentOption } from "@/features/technical-sheets/types/composition-component-option";
import type { CompositionComponentRow } from "@/features/technical-sheets/types/technical-sheet";

type ComponentSortableRowProps = {
  row: CompositionComponentRow;
  componentOptions: CompositionComponentOption[];
  selectedComponentIds: string[];
  onChange: (next: CompositionComponentRow) => void;
  onRemove: () => void;
  canRemove: boolean;
};

export function ComponentSortableRow({
  row,
  componentOptions,
  selectedComponentIds,
  onChange,
  onRemove,
  canRemove,
}: ComponentSortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: row.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  function patch(partial: Partial<CompositionComponentRow>) { onChange({ ...row, ...partial }); }

  function getOption(componentId: string) {
    return componentOptions.find((option) => option.id === componentId);
  }

  function handleSelectComponent(componentId: string) {
    const option = getOption(componentId);
    patch({ componentId, unitCost: option?.unitCost ?? row.unitCost });
  }

  const availableOptions = componentOptions.filter(
    (option) => option.id === row.componentId || !selectedComponentIds.includes(option.id),
  );

  const selectedComponent = row.componentId ? getOption(row.componentId) : null;
  const componentUnit = selectedComponent?.unit ?? "";
  const decimalPlaces = useDecimalPlacesByAbbreviation(componentUnit);
  const quantityStep = decimalPlaces > 0 ? 1 / 10 ** decimalPlaces : 1;

  function roundToUnit(value: number): number {
    const factor = 10 ** decimalPlaces;
    return Math.round(value * factor) / factor;
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: compositionCol.gap,
        py: 1.25,
        borderBottom: 1,
        borderColor: "divider",
        ...(isDragging && { zIndex: 10, bgcolor: "action.hover", opacity: 0.8, borderRadius: 1 }),
      }}
    >
      <Button
        type="button"
        variant="text"
        aria-label="Reordenar componente"
        {...attributes}
        {...listeners}
        sx={{ minWidth: compositionCol.handle, width: compositionCol.handle, flexShrink: 0, px: 0.5, cursor: "grab", color: "text.secondary", "&:active": { cursor: "grabbing" } }}
      >
        <DragIndicator sx={{ fontSize: 16 }} />
      </Button>
      <Box sx={{ minWidth: compositionCol.insumoMin, flex: `1 1 ${compositionCol.insumoMin}px` }}>
        {selectedComponent ? (
          <Box sx={{ display: "flex", flexDirection: "column", pl: 1 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                color: "text.primary"
              }}>
              {selectedComponent.name}
            </Typography>
            <Typography variant="caption" sx={{
              color: "text.secondary"
            }}>
              Unidade: {selectedComponent.unit}
            </Typography>
          </Box>
        ) : (
          <Autocomplete
            id={`component-select-${row.id}`}
            options={availableOptions}
            value={null}
            onChange={(_event, next) => {
              if (next) handleSelectComponent(next.id);
            }}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            label="Insumo"
            placeholder="Buscar insumo..."
            noOptionsText="Nenhum insumo encontrado"
            fullWidth
          />
        )}
      </Box>
      <Box sx={{ display: "flex", width: compositionCol.optional, flexShrink: 0, justifyContent: "center" }}>
        <Checkbox
          checked={row.optional}
          onChange={(event) => patch({ optional: event.target.checked })}
          aria-label="Componente opcional"
        />
      </Box>
      <Box sx={{ width: compositionCol.quantity, flexShrink: 0 }}>
        <NumberInput
          value={row.quantity}
          minValue={0}
          step={quantityStep}
          onValueChange={(next) => { patch({ quantity: Number.isFinite(next) && next >= 0 ? roundToUnit(next) : 0 }); }}
          aria-label="Quantidade do componente"
          sx={{ width: "100%" }}
        />
      </Box>
      <Box sx={{ width: compositionCol.unitCost, flexShrink: 0, display: { xs: "none", md: "block" } }}>
        <CurrencyInput
          value={row.unitCost}
          onValueChange={(unitCost) => patch({ unitCost })}
          aria-label="Custo unitário do componente"
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">R$</InputAdornment>
              ),
            },
          }}
        />
      </Box>
      <Box sx={{ width: compositionCol.total, flexShrink: 0 }}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "text.primary"
          }}>
          {formatCurrency(computeRowTotal(row))}
        </Typography>
      </Box>
      <Button
        type="button"
        variant="text"
        disabled={!canRemove}
        aria-label="Remover componente"
        onClick={onRemove}
        sx={{ minWidth: compositionCol.remove, width: compositionCol.remove, flexShrink: 0, px: 0.5, color: canRemove ? "error.main" : "text.disabled", "&:hover": { color: canRemove ? "error.dark" : "text.disabled" } }}
      >
        <DeleteOutlined sx={{ fontSize: 16 }} />
      </Button>
    </Box>
  );
}

