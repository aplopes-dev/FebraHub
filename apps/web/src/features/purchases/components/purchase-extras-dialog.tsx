"use client";

import { useState } from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  MenuItem,
  Select,
} from "@/ui";
import type { CarrierOption } from "@/features/carriers/types/carrier";
import type { PurchaseExtras } from "@/features/purchases/types/purchase";

type PurchaseExtrasDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  value: PurchaseExtras;
  carriers: CarrierOption[];
  onApply: (extras: PurchaseExtras) => void;
};

export function PurchaseExtrasDialog({
  open,
  onOpenChange,
  value,
  carriers,
  onApply,
}: PurchaseExtrasDialogProps) {
  const [draft, setDraft] = useState<PurchaseExtras>(value);
  const [wasOpen, setWasOpen] = useState(open);

  // Ajuste durante o render (padrão React para "prop mudou"), não efeito: o
  // dep `value` é uma referência nova a cada mudança do formulário, então um
  // `useEffect([open, value])` reescrevia o rascunho do usuário enquanto o
  // diálogo estava aberto. Aqui o reset acontece só na transição fechado→aberto.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  function handleClose() {
    onOpenChange(false);
  }

  function handleApply() {
    onApply({ ...draft });
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs">
      <DialogTitle>Frete e despesas</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Informe transportadora, frete, descontos e outras despesas. Os valores
          entram no total da compra e no rateio.
        </DialogContentText>

        <Stack spacing={2.5}>
          <FormControl fullWidth>
            <InputLabel id="extras-carrier-label">Transportadora</InputLabel>
            <Select
              labelId="extras-carrier-label"
              id="extras-carrier"
              label="Transportadora"
              value={draft.carrierId || "none"}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  carrierId:
                    event.target.value === "none" ? "" : String(event.target.value),
                }))
              }
            >
              <MenuItem value="none">Nenhuma</MenuItem>
              {carriers.map((carrier) => (
                <MenuItem key={carrier.id} value={carrier.id}>
                  {carrier.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <CurrencyInput
            label="Valor do frete"
            value={draft.freight}
            onValueChange={(freight) =>
              setDraft((current) => ({
                ...current,
                freight: Math.max(0, freight),
              }))
            }
          />

          <CurrencyInput
            label="Descontos"
            value={draft.discounts}
            onValueChange={(discounts) =>
              setDraft((current) => ({
                ...current,
                discounts: Math.max(0, discounts),
              }))
            }
          />

          <CurrencyInput
            label="Outras despesas"
            value={draft.otherExpenses}
            onValueChange={(otherExpenses) =>
              setDraft((current) => ({
                ...current,
                otherExpenses: Math.max(0, otherExpenses),
              }))
            }
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={handleClose}>
          Cancelar
        </Button>
        <Button type="button" variant="contained" onClick={handleApply}>
          Aplicar
        </Button>
      </DialogActions>
    </Dialog>
  );
}
