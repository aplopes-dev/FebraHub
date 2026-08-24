"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
} from "@citybox/mui";
import {
  PAYMENT_METHOD_FISCAL_CODE_OPTIONS,
  PAYMENT_METHOD_INSTALLMENT_OPTIONS,
  PAYMENT_METHOD_NAME_MAX,
  findFiscalCodeOption,
  findInstallmentOption,
} from "@/features/payment-methods/data/payment-method-options";
import type {
  PaymentMethodFormValues,
  PaymentMethodInstallmentPermission,
} from "@/features/payment-methods/types/payment-method";

export type PaymentMethodFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  initialValues: PaymentMethodFormValues;
  /** Muda a cada abertura para remontar o corpo (reseta o estado do form). */
  formKey: string;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentMethodFormValues) => void;
  isSaving?: boolean;
};

export function PaymentMethodFormDialog({
  open,
  mode,
  initialValues,
  formKey,
  onOpenChange,
  onSave,
  isSaving = false,
}: PaymentMethodFormDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onOpenChange(false);
      }}
      maxWidth="sm"
      fullWidth
    >
      <PaymentMethodFormDialogBody
        key={formKey}
        mode={mode}
        initialValues={initialValues}
        onOpenChange={onOpenChange}
        onSave={onSave}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function PaymentMethodFormDialogBody({
  mode,
  initialValues,
  onOpenChange,
  onSave,
  isSaving,
}: {
  mode: "create" | "edit";
  initialValues: PaymentMethodFormValues;
  onOpenChange: (open: boolean) => void;
  onSave: (values: PaymentMethodFormValues) => void;
  isSaving: boolean;
}) {
  const [name, setName] = useState(initialValues.name);
  const [fiscalCode, setFiscalCode] = useState(initialValues.fiscalCode);
  const [installmentPermission, setInstallmentPermission] = useState(
    initialValues.installmentPermission,
  );

  const canSave = Boolean(name.trim()) && !isSaving;

  return (
    <>
      <DialogTitle>
        {mode === "create"
          ? "Nova forma de pagamento"
          : "Editar forma de pagamento"}
      </DialogTitle>

      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          {mode === "create"
            ? "Crie uma nova forma de pagamento, caso precise de uma opção personalizada que não esteja prevista na plataforma."
            : "Altere os dados desta forma de pagamento personalizada."}
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
          <Box sx={{ position: "relative" }}>
            <FormField
              id="payment-method-name"
              label="Nome"
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: PAYMENT_METHOD_NAME_MAX } }}
              disabled={isSaving}
              autoFocus
            />
            <Typography
              variant="caption"
              sx={{
                position: "absolute",
                top: "50%",
                right: 12,
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "text.secondary",
              }}
            >
              {PAYMENT_METHOD_NAME_MAX - name.length}
            </Typography>
          </Box>

          <Autocomplete
            id="payment-method-fiscal-code"
            label="Código do método de pagamento na nota fiscal"
            options={PAYMENT_METHOD_FISCAL_CODE_OPTIONS}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            value={findFiscalCodeOption(fiscalCode)}
            onChange={(_event, option) => setFiscalCode(option?.value ?? null)}
            disabled={isSaving}
          />

          <Autocomplete
            id="payment-method-installment-permission"
            label="Permissão de parcelamento"
            options={[...PAYMENT_METHOD_INSTALLMENT_OPTIONS]}
            getOptionLabel={(option) => option.label}
            isOptionEqualToValue={(option, value) =>
              option.value === value.value
            }
            value={findInstallmentOption(installmentPermission)}
            onChange={(_event, option) =>
              setInstallmentPermission(
                (option?.value as PaymentMethodInstallmentPermission) ?? null,
              )
            }
            disabled={isSaving}
          />
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          onClick={() => onOpenChange(false)}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!canSave}
          loading={isSaving}
          onClick={() =>
            onSave({
              name: name.trim(),
              fiscalCode,
              installmentPermission,
            })
          }
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
