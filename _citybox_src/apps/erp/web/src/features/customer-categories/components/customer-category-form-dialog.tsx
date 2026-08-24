"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Input,
  NumberSpinner,
} from "@citybox/mui";
import type { CustomerCategoryFormValues } from "@/features/customer-categories/types/customer-category";

type CustomerCategoryFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: CustomerCategoryFormValues;
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CustomerCategoryFormValues) => void;
};

export function CustomerCategoryFormDialog({
  open,
  mode,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
}: CustomerCategoryFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      <CustomerCategoryFormDialogBody
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        onOpenChange={onOpenChange}
        onSave={onSave}
      />
    </Dialog>
  );
}

function CustomerCategoryFormDialogBody({
  mode,
  initialValues,
  onOpenChange,
  onSave,
}: {
  mode: "create" | "edit";
  initialValues: CustomerCategoryFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: CustomerCategoryFormValues) => void;
}) {
  const [name, setName] = useState(initialValues.name);
  const [discountPercentage, setDiscountPercentage] = useState(
    initialValues.discountPercentage,
  );

  return (
    <>
      <DialogTitle>
        {mode === "create" ? "Nova categoria" : "Editar categoria"}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Categorias de cliente definem o desconto aplicado automaticamente nas
          vendas para os clientes daquele grupo.
        </Typography>

        <Box sx={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 2 }}>
          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 8" } }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Nome
            </Typography>
            <Input
              id="customer-category-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex.: Atacado, VIP, Revenda…"
              autoFocus
              fullWidth
            />
          </Box>
          <Box sx={{ gridColumn: { xs: "span 12", sm: "span 4" } }}>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Desconto (%)
            </Typography>
            <NumberSpinner
              id="customer-category-discount"
              value={discountPercentage}
              min={0}
              max={100}
              step={1}
              onValueChange={(value) =>
                setDiscountPercentage(
                  Math.min(100, Math.max(0, value ?? 0)),
                )
              }
              aria-label="Porcentagem de desconto"
              sx={{ width: "100%" }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!name.trim()}
          onClick={() => onSave({ name, discountPercentage })}
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
