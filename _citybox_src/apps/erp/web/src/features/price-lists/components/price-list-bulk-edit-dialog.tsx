"use client";

import { useState } from "react";
import {
  Box,
  Button,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  NumberInput,
  Radio,
  RadioGroup,
  Stack,
  Typography,
} from "@citybox/mui";
import {
  BULK_PRICE_OPERATION_LABELS,
  BULK_PRICE_OPERATION_ORDER,
  type BulkPriceOperation,
} from "@/features/price-lists/types/price-list";

type PriceListBulkEditDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  onApply: (operation: BulkPriceOperation, value: number) => void;
};

function isPercentOperation(operation: BulkPriceOperation): boolean {
  return operation === "increase_percent" || operation === "decrease_percent";
}

export function PriceListBulkEditDialog({
  open,
  onOpenChange,
  selectedCount,
  onApply,
}: PriceListBulkEditDialogProps) {
  const [operation, setOperation] =
    useState<BulkPriceOperation>("increase_percent");
  const [value, setValue] = useState(0);

  function handleApply() {
    onApply(operation, value);
    onOpenChange(false);
    setOperation("increase_percent");
    setValue(0);
  }

  const percent = isPercentOperation(operation);

  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="xs">
      <DialogTitle>Editar valores</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Aplicar a {selectedCount} produto
          {selectedCount === 1 ? "" : "s"} selecionado
          {selectedCount === 1 ? "" : "s"}.
        </DialogContentText>

        <RadioGroup
          value={operation}
          onChange={(_, next) => setOperation(next as BulkPriceOperation)}
        >
          {BULK_PRICE_OPERATION_ORDER.map((op) => (
            <FormControlLabel
              key={op}
              value={op}
              control={<Radio />}
              label={BULK_PRICE_OPERATION_LABELS[op]}
            />
          ))}
        </RadioGroup>

        <Box sx={{ mt: 2 }}>
          {percent ? (
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <NumberInput
                id="bulk-value"
                label="Porcentagem"
                value={value}
                minValue={0}
                step={0.01}
                onValueChange={(next) =>
                  setValue(Number.isFinite(next) && next >= 0 ? next : 0)
                }
              />
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                %
              </Typography>
            </Stack>
          ) : (
            <CurrencyInput
              label="Valor"
              value={value}
              onValueChange={setValue}
            />
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button type="button" variant="contained" onClick={handleApply}>
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
