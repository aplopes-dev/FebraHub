"use client";

import { useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import { Button, CurrencyInput, MenuItem, NumberSpinner, Select } from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form";
import { SaleOrderAmountDialog } from "@/features/sales-orders/components/sale-order-amount-dialog";
import {
  computeRemainingPaymentAmount,
  computeSaleOrderTotal,
  formatCurrencyBRL,
  sumLineAmounts,
} from "@/features/sales-orders/lib/sale-order-form-values";
import type { SaleOrderFormValues } from "@/features/sales-orders/types/sale-order-form";
import type { BankAccountOption, PaymentMethodOption } from "@/lib/option-types";
import { CARD_BRAND_OPTIONS } from "@/features/card-contracts/data/card-brands";

type SaleOrderPaymentPatch = Partial<{
  amount: number;
  paymentMethodId: string;
  bankAccountId: string;
  cardPaymentType: PaymentMethodOption["cardPaymentType"];
  brand: string;
  installments: number;
}>;

type SaleOrderPaymentsPanelProps = {
  values: SaleOrderFormValues;
  paymentMethods: PaymentMethodOption[];
  bankAccounts: BankAccountOption[];
  disabled?: boolean;
  onAddPayment: () => void;
  onRemovePayment: (paymentId: string) => void;
  onUpdatePayment: (paymentId: string, patch: SaleOrderPaymentPatch) => void;
  onDeliveryFeeChange: (deliveryFee: number) => void;
  onDiscountsChange: (discounts: number) => void;
};

function remainingBannerSx(remaining: number) {
  if (remaining === 0) {
    return {
      borderColor: (theme: { palette: { success: { main: string } } }) =>
        alpha(theme.palette.success.main, 0.35),
      bgcolor: "success.light",
      color: "success.dark",
    };
  }
  if (remaining > 0) {
    return {
      borderColor: (theme: { palette: { warning: { main: string } } }) =>
        alpha(theme.palette.warning.main, 0.35),
      bgcolor: "warning.light",
      color: "warning.dark",
    };
  }
  return {
    borderColor: (theme: { palette: { error: { main: string } } }) =>
      alpha(theme.palette.error.main, 0.35),
    bgcolor: "error.light",
    color: "error.dark",
  };
}

export function SaleOrderPaymentsPanel({
  values,
  paymentMethods,
  bankAccounts,
  disabled = false,
  onAddPayment,
  onRemovePayment,
  onUpdatePayment,
  onDeliveryFeeChange,
  onDiscountsChange,
}: SaleOrderPaymentsPanelProps) {
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [discountsOpen, setDiscountsOpen] = useState(false);

  const subtotal = sumLineAmounts(values.lines);
  const total = computeSaleOrderTotal(values);
  const remaining = computeRemainingPaymentAmount(values);
  const hasSplitPayments = values.payments.length > 1;

  return (
    <Box sx={{ ...formSectionBoxSx }}>
      <Stack spacing={3}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            Pagamentos
          </Typography>
          <Button
            type="button"
            variant="text"
            startIcon={<AddIcon fontSize="small" />}
            disabled={disabled}
            onClick={onAddPayment}
            sx={{ px: 0 }}
          >
            Adicionar recebimento
          </Button>
        </Stack>

        {values.payments.map((payment, paymentIndex) => (
          <Box
            key={payment.id}
            sx={{
              pt: values.payments.length > 1 && paymentIndex > 0 ? 2 : 0,
              borderTop:
                values.payments.length > 1 && paymentIndex > 0 ? 1 : 0,
              borderColor: "divider",
            }}
          >
            <Stack spacing={2}>
              {values.payments.length > 1 ? (
                <Stack
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "text.secondary" }}
                  >
                    Recebimento {paymentIndex + 1} de {values.payments.length}
                  </Typography>
                  <IconButton
                    type="button"
                    size="small"
                    aria-label={`Remover recebimento ${paymentIndex + 1}`}
                    disabled={disabled}
                    onClick={() => onRemovePayment(payment.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : null}

              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  alignItems: "start",
                  gridTemplateColumns: {
                    sm: "minmax(7.5rem, 9rem) minmax(0, 1fr) minmax(0, 1fr)",
                  },
                }}
              >
                <CurrencyInput
                  id={`payment-amount-${payment.id}`}
                  label="Valor"
                  fullWidth
                  value={payment.amount}
                  disabled={disabled}
                  onValueChange={(amount) =>
                    onUpdatePayment(payment.id, { amount })
                  }
                />

                <FormControl fullWidth disabled={disabled}>
                  <InputLabel id={`payment-method-label-${payment.id}`}>
                    Forma de pagamento
                  </InputLabel>
                  <Select
                    labelId={`payment-method-label-${payment.id}`}
                    id={`payment-method-${payment.id}`}
                    label="Forma de pagamento"
                    value={payment.paymentMethodId}
                    disabled={disabled}
                    onChange={(event) => {
                      const methodId = String(event.target.value);
                      const method = paymentMethods.find(
                        (option) => option.id === methodId,
                      );
                      // Bandeira/parcelas só fazem sentido para a nova forma —
                      // limpa ambas ao trocar, evitando dado obsoleto (ex.:
                      // bandeira de um cartão preso a um pagamento em dinheiro).
                      onUpdatePayment(payment.id, {
                        paymentMethodId: methodId,
                        cardPaymentType: method?.cardPaymentType,
                        brand: undefined,
                        installments: undefined,
                      });
                    }}
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth disabled={disabled}>
                  <InputLabel id={`bank-account-label-${payment.id}`}>
                    Conta bancária
                  </InputLabel>
                  <Select
                    labelId={`bank-account-label-${payment.id}`}
                    id={`bank-account-${payment.id}`}
                    label="Conta bancária"
                    value={payment.bankAccountId}
                    disabled={disabled}
                    onChange={(event) =>
                      onUpdatePayment(payment.id, {
                        bankAccountId: String(event.target.value),
                      })
                    }
                  >
                    {bankAccounts.length === 0 ? (
                      <MenuItem value="" disabled>
                        Nenhuma conta bancária cadastrada
                      </MenuItem>
                    ) : null}
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {payment.cardPaymentType === "debit" ||
              payment.cardPaymentType === "credit" ? (
                <Box
                  sx={{
                    display: "grid",
                    gap: 2,
                    alignItems: "start",
                    gridTemplateColumns: {
                      sm:
                        payment.cardPaymentType === "credit"
                          ? "minmax(0, 1fr) minmax(0, 1fr)"
                          : "minmax(0, 1fr)",
                    },
                  }}
                >
                  <FormControl fullWidth disabled={disabled}>
                    <InputLabel id={`payment-brand-label-${payment.id}`}>
                      Bandeira
                    </InputLabel>
                    <Select
                      labelId={`payment-brand-label-${payment.id}`}
                      id={`payment-brand-${payment.id}`}
                      label="Bandeira"
                      value={payment.brand ?? ""}
                      displayEmpty
                      disabled={disabled}
                      onChange={(event) =>
                        onUpdatePayment(payment.id, {
                          brand: String(event.target.value),
                        })
                      }
                    >
                      <MenuItem value="" disabled>
                        Selecione a bandeira
                      </MenuItem>
                      {CARD_BRAND_OPTIONS.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {payment.cardPaymentType === "credit" ? (
                    <NumberSpinner
                      id={`payment-installments-${payment.id}`}
                      label="Parcelas"
                      value={payment.installments ?? 1}
                      min={1}
                      step={1}
                      disabled={disabled}
                      onValueChange={(value) =>
                        onUpdatePayment(payment.id, { installments: value ?? 1 })
                      }
                    />
                  ) : null}
                </Box>
              ) : null}
            </Stack>
          </Box>
        ))}

        {hasSplitPayments ? (
          <Stack
            direction="row"
            spacing={2}
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              border: 1,
              borderRadius: 1,
              px: 1.5,
              py: 1,
              typography: "body2",
              fontWeight: 500,
              ...remainingBannerSx(remaining),
            }}
          >
            <span>
              {remaining === 0
                ? "Recebimentos cobrem o total do pedido"
                : remaining > 0
                  ? "Restante a receber"
                  : "Valor recebido a mais"}
            </span>
            <Box
              component="span"
              sx={{ fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(Math.abs(remaining))}
            </Box>
          </Stack>
        ) : null}

        <Stack
          spacing={1}
          sx={{
            borderTop: 1,
            borderColor: "divider",
            pt: 2,
            alignItems: "flex-end",
          }}
        >
          <Stack direction="row" spacing={3} sx={{ typography: "body2" }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Subtotal
            </Typography>
            <Typography
              variant="body2"
              sx={{
                minWidth: 96,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrencyBRL(subtotal)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ typography: "body2" }}>
            <Button
              type="button"
              variant="text"
              disabled={disabled}
              onClick={() => setDeliveryOpen(true)}
              sx={{ px: 0, minWidth: 0, typography: "body2" }}
            >
              Taxa de entrega
            </Button>
            <Typography
              variant="body2"
              sx={{
                minWidth: 96,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrencyBRL(values.deliveryFee)}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={3} sx={{ typography: "body2" }}>
            <Button
              type="button"
              variant="text"
              disabled={disabled}
              onClick={() => setDiscountsOpen(true)}
              sx={{ px: 0, minWidth: 0, typography: "body2" }}
            >
              Descontos
            </Button>
            <Typography
              variant="body2"
              sx={{
                minWidth: 96,
                textAlign: "right",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrencyBRL(values.discounts)}
            </Typography>
          </Stack>
          <Stack
            direction="row"
            spacing={3}
            sx={{ typography: "body2", fontWeight: 600, pt: 0.5 }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Total
            </Typography>
            <Typography
              variant="body2"
              sx={{
                minWidth: 96,
                textAlign: "right",
                fontWeight: 600,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {formatCurrencyBRL(total)}
            </Typography>
          </Stack>
        </Stack>
      </Stack>

      <SaleOrderAmountDialog
        open={!disabled && deliveryOpen}
        onOpenChange={setDeliveryOpen}
        title="Taxa de entrega"
        description="Informe o valor da taxa de entrega deste pedido."
        label="Taxa de entrega"
        value={values.deliveryFee}
        onApply={onDeliveryFeeChange}
      />

      <SaleOrderAmountDialog
        open={!disabled && discountsOpen}
        onOpenChange={setDiscountsOpen}
        title="Descontos"
        description="Informe o valor total de descontos aplicados ao pedido."
        label="Descontos"
        value={values.discounts}
        onApply={onDiscountsChange}
      />
    </Box>
  );
}
