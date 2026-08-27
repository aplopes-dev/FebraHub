"use client";

import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import { MenuItem, Select } from "@/ui";
import {
  STOCK_MOVEMENT_REASON_FILTER_ORDER,
  STOCK_MOVEMENT_REASON_LABELS,
  type StockMovementReason,
} from "@/features/stock-movements/types/stock-movement-reason";

const ALL_OPTION = "all";

type StockMovementReasonFilterProps = {
  value: StockMovementReason | null;
  onChange: (value: StockMovementReason | null) => void;
};

export function StockMovementReasonFilter({
  value,
  onChange,
}: StockMovementReasonFilterProps) {
  return (
    <FormControl sx={{ width: { xs: "100%", sm: 224 } }}>
      <InputLabel id="stock-movement-reason-filter-label">Motivo</InputLabel>
      <Select
        labelId="stock-movement-reason-filter-label"
        id="stock-movement-reason-filter"
        label="Motivo"
        size="small"
        value={value ?? ALL_OPTION}
        onChange={(event) => {
          const next = String(event.target.value);
          onChange(next === ALL_OPTION ? null : (next as StockMovementReason));
        }}
      >
        <MenuItem value={ALL_OPTION}>Todos os motivos</MenuItem>
        {STOCK_MOVEMENT_REASON_FILTER_ORDER.map((reason) => (
          <MenuItem key={reason} value={reason}>
            {STOCK_MOVEMENT_REASON_LABELS[reason]}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
