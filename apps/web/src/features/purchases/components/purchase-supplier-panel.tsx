"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { MenuItem, Select } from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import type { SupplierOption } from "@/features/purchases/types/purchase";

type PurchaseSupplierPanelProps = {
  supplierId: string;
  suppliers: SupplierOption[];
  onSupplierChange: (supplierId: string) => void;
};

export function PurchaseSupplierPanel({
  supplierId,
  suppliers,
  onSupplierChange,
}: PurchaseSupplierPanelProps) {
  const selected = suppliers.find((item) => item.id === supplierId);

  return (
    <Box sx={formSectionBoxSx}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Fornecedor
        </Typography>

        <FormControl fullWidth>
          <InputLabel id="purchase-supplier-label">Fornecedor</InputLabel>
          <Select
            labelId="purchase-supplier-label"
            id="purchase-supplier"
            label="Fornecedor"
            value={supplierId || ""}
            onChange={(event) => onSupplierChange(String(event.target.value))}
          >
            {suppliers.map((supplier) => (
              <MenuItem key={supplier.id} value={supplier.id}>
                {supplier.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selected && (selected.phone || selected.email) ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            {[selected.phone, selected.email].filter(Boolean).join(" · ")}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
