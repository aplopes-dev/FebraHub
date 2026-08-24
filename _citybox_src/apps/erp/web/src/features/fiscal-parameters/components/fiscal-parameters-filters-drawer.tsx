"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Drawer,
  FormControlLabel,
  Stack,
  Typography,
} from "@citybox/mui";
import {
  FISCAL_STATUS_OPTIONS,
  createEmptyFiscalParameterFilters,
} from "@/features/fiscal-parameters/lib/fiscal-parameters-filters";
import type {
  FiscalParameterListFilters,
  FiscalStatus,
} from "@/features/fiscal-parameters/types/fiscal-parameters";

type FiscalParametersFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: FiscalParameterListFilters;
  categories: string[];
  onApply: (filters: FiscalParameterListFilters) => void;
};

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item)
    ? list.filter((entry) => entry !== item)
    : [...list, item];
}

export function FiscalParametersFiltersDrawer({
  open,
  onOpenChange,
  value,
  categories,
  onApply,
}: FiscalParametersFiltersDrawerProps) {
  const [draft, setDraft] = useState<FiscalParameterListFilters>(value);

  useEffect(() => {
    if (open) {
      setDraft(value);
    }
  }, [open, value]);

  function handleClear() {
    setDraft(createEmptyFiscalParameterFilters());
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
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Aplicar filtro
          </Button>
        </Stack>
      }
    >
      <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
        Refine os produtos por situação fiscal e categoria.
      </Typography>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1.5 }}>
            Situação fiscal
          </Typography>
          <Stack spacing={0.5}>
            {FISCAL_STATUS_OPTIONS.map((option) => (
              <FormControlLabel
                key={option.value}
                control={
                  <Checkbox
                    checked={draft.statuses.includes(option.value)}
                    onChange={() =>
                      setDraft((current) => ({
                        ...current,
                        statuses: toggleInList(
                          current.statuses,
                          option.value as FiscalStatus,
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
