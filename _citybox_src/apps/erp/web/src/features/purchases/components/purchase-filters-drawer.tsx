"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import { Button, Drawer, FormField, MenuItem, Select } from "@citybox/mui";
import { createEmptyPurchaseFilters } from "@/features/purchases/lib/purchase-filters";
import type { PurchaseListFilters, SupplierOption } from "@/features/purchases/types/purchase";
import type { WarehouseOption } from "@/lib/option-types";

type PurchaseFiltersDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PurchaseListFilters;
  warehouses: WarehouseOption[];
  suppliers: SupplierOption[];
  onApply: (filters: PurchaseListFilters) => void;
};

export function PurchaseFiltersDrawer({
  open,
  onOpenChange,
  value,
  warehouses,
  suppliers,
  onApply,
}: PurchaseFiltersDrawerProps) {
  const [draft, setDraft] = useState<PurchaseListFilters>(value);
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
    setDraft(createEmptyPurchaseFilters());
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
          Refine a listagem por estoque, fornecedor e período.
        </Box>

        <FormControl fullWidth>
          <InputLabel id="filter-warehouse-label">Estoque</InputLabel>
          <Select
            labelId="filter-warehouse-label"
            id="filter-warehouse"
            label="Estoque"
            value={draft.warehouseId ?? "all"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                warehouseId:
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
          <InputLabel id="filter-supplier-label">Fornecedor</InputLabel>
          <Select
            labelId="filter-supplier-label"
            id="filter-supplier"
            label="Fornecedor"
            value={draft.supplierId ?? "all"}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                supplierId:
                  event.target.value === "all" ? null : String(event.target.value),
              }))
            }
          >
            <MenuItem value="all">Todos</MenuItem>
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormField
          id="filter-date-from"
          label="Data inicial"
          type="date"
          value={draft.dateFrom ?? ""}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              dateFrom: event.target.value || null,
            }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />

        <FormField
          id="filter-date-to"
          label="Data final"
          type="date"
          value={draft.dateTo ?? ""}
          onChange={(event) =>
            setDraft((current) => ({
              ...current,
              dateTo: event.target.value || null,
            }))
          }
          slotProps={{ inputLabel: { shrink: true } }}
        />
      </Stack>
    </Drawer>
  );
}
