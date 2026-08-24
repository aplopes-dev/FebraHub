"use client";

import Add from "@mui/icons-material/Add";

import { useMemo, useState } from "react";
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
import Typography from "@mui/material/Typography";
import { Badge, Button, FormField, Tab, Tabs } from "@citybox/mui";
import { VariationCalculationSection } from "@/features/variations/components/variation-calculation-section";
import { VariationOptionSortableRow } from "@/features/variations/components/variation-option-sortable-row";
import { createEmptyVariationOption } from "@/features/variations/api/variations.service";
import type {
  VariationCalculationConfig,
  VariationFormValues,
  VariationOption,
} from "@/features/variations/types/variation";

type VariationFormTab = "options" | "calculation";

type VariationFormProps = {
  initialValues: VariationFormValues;
  onSubmit: (values: VariationFormValues) => void;
  formId: string;
};

export function VariationForm({
  initialValues,
  onSubmit,
  formId,
}: VariationFormProps) {
  const [tab, setTab] = useState<VariationFormTab>("options");
  const [name, setName] = useState(initialValues.name);
  const [options, setOptions] = useState<VariationOption[]>(
    initialValues.options,
  );
  const [calculation, setCalculation] = useState<VariationCalculationConfig>(
    initialValues.calculation,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const optionIds = useMemo(
    () => options.map((option) => option.id),
    [options],
  );

  function updateOption(next: VariationOption) {
    setOptions((prev) =>
      prev.map((option) => (option.id === next.id ? next : option)),
    );
  }

  function handleAddOption() {
    setOptions((prev) => [...prev, createEmptyVariationOption(prev.length)]);
  }

  function handleRemoveOption(optionId: string) {
    setOptions((prev) => {
      if (prev.length <= 1) {
        return [createEmptyVariationOption(0)];
      }
      return prev
        .filter((option) => option.id !== optionId)
        .map((option, index) => ({ ...option, sortOrder: index }));
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOptions((prev) => {
      const oldIndex = prev.findIndex((item) => item.id === active.id);
      const newIndex = prev.findIndex((item) => item.id === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex).map((option, index) => ({
        ...option,
        sortOrder: index,
      }));
    });
  }

  const namedOptionsCount = options.filter((option) =>
    option.name.trim(),
  ).length;

  return (
    <Box
      component="form"
      id={formId}
      sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ name, options, calculation });
      }}
    >
      <Stack spacing={0.75}>
        <FormField
          id="variation-name"
          label="Nome da variação"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex.: Tamanho, Cor, Sabor…"
          required
          autoFocus
        />
        <Typography variant="caption" sx={{
          color: "text.secondary"
        }}>
          Identifica o grupo de opções no produto (ex.: “Tamanho”).
        </Typography>
      </Stack>
      <Box
        sx={{
          overflow: "hidden",
          borderRadius: 1,
          border: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, next: VariationFormTab) => setTab(next)}
          variant="fullWidth"
          sx={{
            minHeight: 48,
            borderBottom: 1,
            borderColor: "divider",
            "& .MuiTabs-indicator": { height: 2 },
          }}
        >
          <Tab
            value="options"
            label={
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                Opções
                <Badge
                  label={String(options.length)}
                  color={namedOptionsCount > 0 ? "primary" : "muted"}
                  sx={{ height: 20, "& .MuiChip-label": { px: 0.75 } }}
                />
              </Box>
            }
            sx={tabSx}
          />
          <Tab value="calculation" label="Cálculo" sx={tabSx} />
        </Tabs>

        <Box sx={{ p: 2 }}>
          {tab === "options" ? (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" sx={{
                  fontWeight: 600
                }}>
                  Opções da variação
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "text.secondary",
                    mt: 0.25
                  }}>
                  Arraste para reordenar. Cada opção pode ter imagem, preço e
                  código próprios.
                </Typography>
              </Box>

              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={optionIds}
                  strategy={verticalListSortingStrategy}
                >
                  <Stack spacing={1.5}>
                    {options.map((option, index) => (
                      <VariationOptionSortableRow
                        key={option.id}
                        option={option}
                        index={index}
                        onChange={updateOption}
                        onRemove={() => handleRemoveOption(option.id)}
                        canRemove={
                          options.length > 1 ||
                          Boolean(
                            option.name ||
                              option.description ||
                              option.code ||
                              option.imageUrl ||
                              option.price > 0,
                          )
                        }
                      />
                    ))}
                  </Stack>
                </SortableContext>
              </DndContext>

              <Button
                type="button"
                variant="outlined"
                fullWidth
                onClick={handleAddOption}
                startIcon={<Add sx={{ fontSize: 16 }} />}
                sx={{
                  borderStyle: "dashed",
                  py: 1.25,
                  textTransform: "none",
                }}
              >
                Adicionar opção
              </Button>
            </Stack>
          ) : null}

          {tab === "calculation" ? (
            <VariationCalculationSection
              value={calculation}
              onChange={setCalculation}
            />
          ) : null}
        </Box>
      </Box>
    </Box>
  );
}

const tabSx = {
  minHeight: 48,
  px: 1.5,
  py: 1.5,
  textTransform: "none" as const,
  fontWeight: 500,
  color: "text.secondary",
  "&.Mui-selected": { color: "primary.main" },
};
