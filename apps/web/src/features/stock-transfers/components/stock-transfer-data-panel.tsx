"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import { FormField, MenuItem, Select } from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import type { CarrierOption } from "@/features/carriers/types/carrier";
import {
  STOCK_TRANSFER_NOTES_MAX_LENGTH,
  type StockTransferFormValues,
} from "@/features/stock-transfers/types/stock-transfer";

type StockTransferDataPanelProps = {
  values: StockTransferFormValues;
  carriers: CarrierOption[];
  onCarrierChange: (carrierId: string) => void;
  onResponsibleChange: (name: string) => void;
  onNotesChange: (notes: string) => void;
};

export function StockTransferDataPanel({
  values,
  carriers,
  onCarrierChange,
  onResponsibleChange,
  onNotesChange,
}: StockTransferDataPanelProps) {
  return (
    <Box sx={{ ...formSectionBoxSx, display: "flex", flexDirection: "column", gap: 2.5 }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
        Dados para transferência
      </Typography>

      <FormControl fullWidth>
        <InputLabel id="transfer-carrier-label">Transportadora</InputLabel>
        <Select
          labelId="transfer-carrier-label"
          id="transfer-carrier"
          label="Transportadora"
          value={values.carrierId || ""}
          onChange={(event) => onCarrierChange(String(event.target.value))}
        >
          {carriers.map((carrier) => (
            <MenuItem key={carrier.id} value={carrier.id}>
              {carrier.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <FormField
        id="transfer-responsible"
        label="Nome do responsável"
        value={values.responsibleName}
        onChange={(event) => onResponsibleChange(event.target.value)}
        placeholder="Nome completo"
        autoComplete="off"
      />

      <Box sx={{ position: "relative" }}>
        <FormField
          id="transfer-notes"
          label="Observação"
          value={values.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Opcional"
          multiline
          minRows={4}
          slotProps={{ htmlInput: { maxLength: STOCK_TRANSFER_NOTES_MAX_LENGTH } }}
        />
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            position: "absolute",
            bottom: 10,
            right: 12,
            pointerEvents: "none",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {values.notes.length}/{STOCK_TRANSFER_NOTES_MAX_LENGTH}
        </Typography>
      </Box>
    </Box>
  );
}
