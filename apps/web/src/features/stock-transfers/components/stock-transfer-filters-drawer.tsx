"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import { Button, Drawer, MenuItem, Select } from "@/ui";
import { createEmptyStockTransferFilters } from "@/features/stock-transfers/lib/stock-transfer-filters";
import type { StockTransferListFilters } from "@/features/stock-transfers/types/stock-transfer";
import type { WarehouseOption } from "@/lib/option-types";

type StockTransferFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: StockTransferListFilters;
  warehouses: WarehouseOption[];
  onApply: (filters: StockTransferListFilters) => void;
};

export function StockTransferFiltersDrawer({
  open,
  onOpenChange,
  value,
  warehouses,
  onApply,
}: StockTransferFiltersDrawerProps) {
  const [draft, setDraft] = useState<StockTransferListFilters>(value);
  const [wasOpen, setWasOpen] = useState(open);

  // Ajuste durante o render, não efeito — ver purchase-extras-dialog.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleClear() {
    setDraft(createEmptyStockTransferFilters());
  }

  function handleApply() {
    onApply(draft);
    onOpenChange(false);
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title="Filtros"
      width={400}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button type="button" variant="outlined" onClick={handleClear}>
            Limpar
          </Button>
          <Button type="button" variant="contained" onClick={handleApply}>
            Aplicar
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        <Box component="p" sx={{ m: 0, fontSize: "0.875rem", color: "text.secondary" }}>
          Refine a listagem por estoque de saída e entrada.
        </Box>

        <FormControl fullWidth>
          <InputLabel id="filter-from-label">Estoque de saída</InputLabel>
          <Select
            labelId="filter-from-label"
            id="filter-from"
            label="Estoque de saída"
            value={draft.fromWarehouseId ?? "all"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                fromWarehouseId:
                  event.target.value === "all" ? null : String(event.target.value),
              }))
            }
          >
            <MenuItem value="all">Todos</MenuItem>
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel id="filter-to-label">Estoque de entrada</InputLabel>
          <Select
            labelId="filter-to-label"
            id="filter-to"
            label="Estoque de entrada"
            value={draft.toWarehouseId ?? "all"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                toWarehouseId:
                  event.target.value === "all" ? null : String(event.target.value),
              }))
            }
          >
            <MenuItem value="all">Todos</MenuItem>
            {warehouses.map((warehouse) => (
              <MenuItem key={warehouse.id} value={warehouse.id}>
                {warehouse.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Drawer>
  );
}
