"use client";

import { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Checkbox, Drawer, FormControlLabel } from "@/ui";
import {
  PRODUCTION_TYPE_OPTIONS,
  createEmptyTechnicalSheetFilters,
} from "@/features/technical-sheets/lib/technical-sheet-filters";
import type {
  ProductionType,
  TechnicalSheetListFilters,
} from "@/features/technical-sheets/types/technical-sheet";

type TechnicalSheetFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: TechnicalSheetListFilters;
  categories: string[];
  onApply: (filters: TechnicalSheetListFilters) => void;
};

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

export function TechnicalSheetFiltersDrawer({
  open,
  onOpenChange,
  value,
  categories,
  onApply,
}: TechnicalSheetFiltersDrawerProps) {
  const [draft, setDraft] = useState<TechnicalSheetListFilters>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  function handleClear() {
    setDraft(createEmptyTechnicalSheetFilters());
  }

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  return (
    <Drawer
      open={open}
      onClose={() => onOpenChange(false)}
      title="Filtros"
      width={400}
      footer={
        <Stack direction="row" spacing={1} sx={{
          justifyContent: "flex-end"
        }}>
          <Button type="button" variant="outlined" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Aplicar filtro
          </Button>
        </Stack>
      }
    >
      <Typography
        variant="body2"
        sx={{
          color: "text.secondary",
          mb: 3
        }}>
        Refine as fichas técnicas por tipo de produção e categoria.
      </Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Tipo de produção
          </Typography>
          <Stack spacing={0.5}>
            {PRODUCTION_TYPE_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={draft.productionTypes.includes(option.value)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        productionTypes: toggleInList(
                          current.productionTypes,
                          option.value as ProductionType,
                        ),
                      }))
                    }
                  />
                }
                label={option.label}
              />
            ))}
          </Stack>
        </Box>

        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Categoria
          </Typography>
          <Stack spacing={0.5}>
            {categories.map((category) => (
              <FormControlLabel
                key={category}
                control={
                  <Checkbox
                    checked={draft.categories.includes(category)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        categories: toggleInList(current.categories, category),
                      }))
                    }
                  />
                }
                label={category}
              />
            ))}
          </Stack>
        </Box>
      </Stack>
    </Drawer>
  );
}
