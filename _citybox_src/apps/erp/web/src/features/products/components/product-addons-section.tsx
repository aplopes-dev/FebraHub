"use client";

import Add from "@mui/icons-material/Add";
import InfoOutlined from "@mui/icons-material/InfoOutlined";

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
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Button, Checkbox, NumberSpinner } from "@citybox/mui";
import { ProductAddonSortableRow } from "@/features/products/components/product-addon-sortable-row";
import {
  createEmptyAddonRow,
  type ProductAddonRow,
  type ProductAddonsConfig,
} from "@/features/products/types/product-addons";
import { useProductAddonsQuery } from "@/features/products/hooks/use-product-queries";
import {
  productFormSectionBoxSx,
  productFormSectionGridSx,
  productFormSectionHeaderSx,
} from "@/features/products/lib/product-form-section-styles";

type ProductAddonsSectionProps = {
  value: ProductAddonsConfig;
  onChange: (next: ProductAddonsConfig) => void;
};

const CHARGE_TOOLTIP =
  "Quando ativo, o valor do adicional só é cobrado a partir da quantidade selecionada pelo cliente (respeitando a quantidade mínima gratuita, se houver).";

function updateItems(
  config: ProductAddonsConfig,
  items: ProductAddonRow[],
): ProductAddonsConfig {
  return { ...config, items };
}

function updateRow(
  items: ProductAddonRow[],
  rowId: string,
  next: ProductAddonRow,
): ProductAddonRow[] {
  return items.map((row) => (row.id === rowId ? next : row));
}

export function ProductAddonsSection({
  value,
  onChange,
}: ProductAddonsSectionProps) {
  const addonsQuery = useProductAddonsQuery();
  const addonOptions = addonsQuery.data ?? [];
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const itemIds = useMemo(
    () => value.items.map((item) => item.id),
    [value.items],
  );

  const selectedAddonIds = useMemo(
    () => value.items.map((item) => item.addonId).filter(Boolean),
    [value.items],
  );

  function handleAddRow() {
    onChange(
      updateItems(value, [
        ...value.items,
        createEmptyAddonRow(value.items.length),
      ]),
    );
  }

  function handleRemoveRow(rowId: string) {
    if (value.items.length <= 1) {
      onChange(updateItems(value, [createEmptyAddonRow(0)]));
      return;
    }

    onChange(
      updateItems(
        value,
        value.items
          .filter((row) => row.id !== rowId)
          .map((row, index) => ({ ...row, sortOrder: index })),
      ),
    );
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = value.items.findIndex((item) => item.id === active.id);
    const newIndex = value.items.findIndex((item) => item.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    onChange(
      updateItems(
        value,
        arrayMove(value.items, oldIndex, newIndex).map((item, index) => ({
          ...item,
          sortOrder: index,
        })),
      ),
    );
  }

  function clampQuantity(value: number, fallback: number): number {
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  }

  return (
    <Box component="section" sx={productFormSectionGridSx}>
      <Box component="header" sx={productFormSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{
          fontWeight: 600
        }}>
          Adicionais
        </Typography>
        <Typography variant="body2" sx={{
          color: "text.secondary"
        }}>
          Configure itens opcionais que podem ser adicionados ao produto
          principal pelos clientes, com opções de quantidade mínima e máxima.
        </Typography>
      </Box>
      <Box
        sx={{
          ...productFormSectionBoxSx,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "repeat(2, minmax(0, 1fr))" },
          }}
        >
          <NumberSpinner
            id="addons-min-quantity"
            label="Quantidade mínima"
            value={value.minQuantity}
            min={0}
            step={1}
            onValueChange={(next) =>
              onChange({
                ...value,
                minQuantity: clampQuantity(next ?? 0, value.minQuantity),
              })
            }
          />
          <NumberSpinner
            id="addons-max-quantity"
            label="Quantidade máxima"
            value={value.maxQuantity}
            min={0}
            step={1}
            onValueChange={(next) =>
              onChange({
                ...value,
                maxQuantity: clampQuantity(next ?? 0, value.maxQuantity),
              })
            }
          />
        </Box>

        <Stack spacing={4}>
          <Stack direction="row" spacing={1} sx={{
            alignItems: "center"
          }}>
            <Checkbox
              id="addons-charge-from-selected"
              checked={value.chargeFromSelectedQuantity}
              onChange={(_, checked) =>
                onChange({
                  ...value,
                  chargeFromSelectedQuantity: checked,
                })
              }
              sx={{ p: 0.5 }}
            />
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 0.75,
              }}
            >
              <Typography
                component="label"
                htmlFor="addons-charge-from-selected"
                variant="body2"
                sx={{ cursor: "pointer", lineHeight: 1.43 }}
              >
                Cobrar valor a partir de quantidade selecionada pelo cliente
              </Typography>
              <Tooltip title={CHARGE_TOOLTIP} arrow placement="top">
                <Box
                  component="button"
                  type="button"
                  aria-label="Sobre cobrança por quantidade selecionada"
                  sx={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 16,
                    height: 16,
                    p: 0,
                    border: 0,
                    bgcolor: "transparent",
                    color: "text.secondary",
                    cursor: "help",
                  }}
                >
                  <InfoOutlined sx={{ fontSize: 14 }} />
                </Box>
              </Tooltip>
            </Box>
          </Stack>

          {value.chargeFromSelectedQuantity ? (
            <Box sx={{ maxWidth: 320 }}>
              <NumberSpinner
                id="addons-charge-from-quantity"
                label="Cobrar a partir de"
                value={value.chargeFromQuantity}
                min={1}
                step={1}
                onValueChange={(next) =>
                  onChange({
                    ...value,
                    chargeFromQuantity: Math.max(
                      1,
                      clampQuantity(next ?? 1, value.chargeFromQuantity),
                    ),
                  })
                }
              />
            </Box>
          ) : null}
        </Stack>

        <Stack spacing={1}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              typography: "body2",
              fontWeight: 500,
            }}
          >
            <Box sx={{ width: 32, flexShrink: 0 }} aria-hidden />
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
              Adicional
            </Typography>
            <Typography variant="body2" sx={{ width: 144, flexShrink: 0 }}>
              Qtd. máxima
            </Typography>
            <Typography
              variant="body2"
              sx={{ width: { xs: 112, sm: 128 }, flexShrink: 0 }}
            >
              Preço
            </Typography>
            <Box sx={{ width: 32, flexShrink: 0 }} aria-hidden />
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
              <Box>
                {value.items.map((row) => (
                  <ProductAddonSortableRow
                    key={row.id}
                    row={row}
                    options={addonOptions}
                    selectedAddonIds={selectedAddonIds}
                    onChange={(next) =>
                      onChange(
                        updateItems(
                          value,
                          updateRow(value.items, row.id, next),
                        ),
                      )
                    }
                    onRemove={() => handleRemoveRow(row.id)}
                    canRemove={
                      value.items.length > 1 ||
                      Boolean(
                        row.addonId || row.price > 0 || row.maxQuantity !== 1,
                      )
                    }
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
            disabled={addonOptions.length === 0}
            startIcon={<Add sx={{ fontSize: 18 }} />}
            sx={{ alignSelf: "flex-start", px: 2 }}
          >
            Adicionar adicional
          </Button>
          {addonsQuery.isError ? (
            <Typography variant="body2" color="error">
              Não foi possível carregar o catálogo de adicionais.
            </Typography>
          ) : null}
        </Stack>
      </Box>
    </Box>
  );
}
