"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@citybox/mui";

type SaleOrderAmountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  label: string;
  value: number;
  onApply: (value: number) => void;
};

export function SaleOrderAmountDialog({
  open,
  onOpenChange,
  title,
  description,
  label,
  value,
  onApply,
}: SaleOrderAmountDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      {open ? (
        <AmountForm
          title={title}
          description={description}
          label={label}
          initialValue={value}
          onApply={onApply}
          onClose={() => onOpenChange(false)}
        />
      ) : null}
    </Dialog>
  );
}

function AmountForm({
  title,
  description,
  label,
  initialValue,
  onApply,
  onClose,
}: {
  title: string;
  description: string;
  label: string;
  initialValue: number;
  onApply: (value: number) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState(initialValue);

  function handleApply() {
    onApply(Math.max(0, draft));
    onClose();
  }

  return (
    <>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          {description}
        </Typography>
        <Stack spacing={1}>
          <Typography
            component="label"
            htmlFor="sale-order-amount"
            variant="caption"
            sx={{ color: "text.secondary" }}
          >
            {label}
          </Typography>
          <CurrencyInput
            id="sale-order-amount"
            value={draft}
            onValueChange={setDraft}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="contained" onClick={handleApply}>
          Aplicar
        </Button>
      </DialogActions>
    </>
  );
}
