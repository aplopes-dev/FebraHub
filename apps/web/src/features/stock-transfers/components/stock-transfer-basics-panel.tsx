"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DatePicker, MenuItem, Select } from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/stock-transfers/lib/stock-transfer-form-values";
import type { StockTransferFormValues } from "@/features/stock-transfers/types/stock-transfer";
import type { WarehouseOption } from "@/lib/option-types";

type StockTransferBasicsPanelProps = {
  values: StockTransferFormValues;
  warehouses: WarehouseOption[];
  onFromChange: (warehouseId: string) => void;
  onToChange: (warehouseId: string) => void;
  onOperatedAtChange: (operatedAt: string) => void;
};

export function StockTransferBasicsPanel({
  values,
  warehouses,
  onFromChange,
  onToChange,
  onOperatedAtChange,
}: StockTransferBasicsPanelProps) {
  const operatedDate = parseIsoDate(values.operatedAt);

  return (
    <Box sx={{ ...formSectionBoxSx, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Informações básicas
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="transfer-from-label">Estoque de saída</InputLabel>
        <Select
          labelId="transfer-from-label"
          id="transfer-from"
          label="Estoque de saída"
          value={values.fromWarehouseId || ""}
          onChange={(event) => onFromChange(String(event.target.value))}
        >
          {warehouses.map((warehouse) => (
            <MenuItem key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormControl fullWidth>
        <InputLabel id="transfer-to-label">Estoque de entrada</InputLabel>
        <Select
          labelId="transfer-to-label"
          id="transfer-to"
          label="Estoque de entrada"
          value={values.toWarehouseId || ""}
          onChange={(event) => onToChange(String(event.target.value))}
        >
          {warehouses.map((warehouse) => (
            <MenuItem
              key={warehouse.id}
              value={warehouse.id}
              disabled={warehouse.id === values.fromWarehouseId}
            >
              {warehouse.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <DatePicker
        id="transfer-date"
        label="Data da operação"
        value={operatedDate}
        onChange={(date) => {
          if (date) onOperatedAtChange(toIsoDate(date));
        }}
      />
    </Box>
  );
}
