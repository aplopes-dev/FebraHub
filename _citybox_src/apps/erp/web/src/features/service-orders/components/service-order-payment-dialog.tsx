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
import {
  Button,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  NumberSpinner,
  Select,
  toast,
} from "@citybox/mui";
import {
  computeServiceOrderTotal,
  formatCurrencyBRL,
} from "@/features/service-orders/lib/service-order-totals";
import { createLocalId } from "@/features/service-orders/lib/service-order-form-values";
import { useServiceOrderMutations } from "@/features/service-orders/hooks/use-service-order-mutations";
import { usePaymentMethodsQuery } from "@/features/payment-methods/hooks/use-payment-method-queries";
import { toPaymentMethodOptions } from "@/features/payment-methods/lib/payment-method-option.mapper";
import { CARD_BRAND_OPTIONS } from "@/features/card-contracts/data/card-brands";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";
import type { PaymentMethodOption } from "@/lib/option-types";

type PaymentRow = {
  id: string;
  amount: number;
  paymentMethodId: string;
  bankAccountId: string;
  cardPaymentType: PaymentMethodOption["cardPaymentType"];
  brand: string;
  installments: number;
};

type ServiceOrderPaymentDialogProps = {
  /** OS a faturar — `null` fecha o dialog. */
  order: ServiceOrder | null;
  onOpenChange: (open: boolean) => void;
  /** Chamado após faturar com sucesso (refresh da lista). */
  onCompleted?: () => void;
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

export function ServiceOrderPaymentDialog({
  order,
  onOpenChange,
  onCompleted,
}: ServiceOrderPaymentDialogProps) {
  return (
    <Dialog
      open={order != null}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
    >
      {order ? (
        <ServiceOrderPaymentDialogBody
          key={order.id}
          order={order}
          onClose={() => onOpenChange(false)}
          onCompleted={onCompleted}
        />
      ) : null}
    </Dialog>
  );
}

function ServiceOrderPaymentDialogBody({
  order,
  onClose,
  onCompleted,
}: {
  order: ServiceOrder;
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const mutations = useServiceOrderMutations();
  const total = computeServiceOrderTotal(order.lines);
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccounts = bankAccountsQuery.data ?? [];
  const paymentMethodsQuery = usePaymentMethodsQuery();
  const paymentMethods = toPaymentMethodOptions(paymentMethodsQuery.data ?? []);

  function emptyPayment(amount: number): PaymentRow {
    return {
      id: createLocalId("pay"),
      amount,
      paymentMethodId: "",
      bankAccountId: "",
      cardPaymentType: undefined,
      brand: "",
      installments: 1,
    };
  }

  const [payments, setPayments] = useState<PaymentRow[]>(() => [
    emptyPayment(total),
  ]);

  const received =
    Math.round(payments.reduce((acc, payment) => acc + payment.amount, 0) * 100) /
    100;
  const remaining = Math.round((total - received) * 100) / 100;

  function addPayment() {
    setPayments((prev) => [...prev, emptyPayment(Math.max(0, remaining))]);
  }

  function handleMethodChange(paymentId: string, methodId: string) {
    const method = paymentMethods.find((option) => option.id === methodId);
    updatePayment(paymentId, {
      paymentMethodId: methodId,
      cardPaymentType: method?.cardPaymentType,
      // Trocar de forma reseta bandeira/parcelas — evita mandar bandeira de
      // débito escondida numa forma que virou dinheiro/Pix.
      brand: "",
      installments: 1,
    });
  }

  function removePayment(id: string) {
    setPayments((prev) => prev.filter((payment) => payment.id !== id));
  }

  function updatePayment(id: string, patch: Partial<PaymentRow>) {
    setPayments((prev) =>
      prev.map((payment) =>
        payment.id === id ? { ...payment, ...patch } : payment,
      ),
    );
  }

  function handleConfirm() {
    // FR-003 (spec erp/031) — bloqueia antes de chamar o servidor quando a
    // OS não tem nenhuma linha lançada, em vez de deixar o erro cru da API
    // chegar ao usuário.
    if (order.lines.length === 0) {
      toast.error(
        "Adicione ao menos um produto ou serviço à OS antes de gerar a venda.",
      );
      return;
    }
    if (remaining > 0) {
      toast.error(
        `Ainda faltam ${formatCurrencyBRL(remaining)} para cobrir o total da OS.`,
      );
      return;
    }
    if (payments.some((payment) => !payment.paymentMethodId)) {
      toast.error("Selecione a forma de pagamento de cada recebimento.");
      return;
    }
    if (
      payments.some(
        (payment) =>
          (payment.cardPaymentType === "debit" ||
            payment.cardPaymentType === "credit") &&
          !payment.brand,
      )
    ) {
      toast.error("Selecione a bandeira dos recebimentos em cartão.");
      return;
    }

    mutations.generateSale.mutate(
      {
        id: order.id,
        payments: payments.map((payment) => ({
          amountCents: Math.round(payment.amount * 100),
          methodId: payment.paymentMethodId,
          bankAccountId: payment.bankAccountId || undefined,
          cardPaymentType: payment.cardPaymentType,
          brand: payment.brand || undefined,
          installments:
            payment.cardPaymentType === "credit"
              ? payment.installments
              : undefined,
        })),
      },
      {
        onSuccess: (generated) => {
          toast.success(
            `${order.code} concluída — venda #${generated.saleNumber} gerada.`,
          );
          onClose();
          onCompleted?.();
        },
      },
    );
  }

  return (
    <>
      <DialogTitle>Receber e gerar venda — {order.code}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 2 }}>
          Confirme o recebimento de {order.customerName}. Ao salvar, a OS é
          concluída e a venda aparece na tela de Vendas.
        </Typography>

        <Stack spacing={2}>
          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              borderRadius: 1,
              bgcolor: "action.hover",
              px: 1.5,
              py: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Total da OS
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(total)}
            </Typography>
          </Stack>

          {payments.map((payment, index) => (
            <Box
              key={payment.id}
              sx={{
                pt: payments.length > 1 && index > 0 ? 2 : 0,
                borderTop:
                  payments.length > 1 && index > 0 ? 1 : 0,
                borderColor: "divider",
              }}
            >
              {payments.length > 1 ? (
                <Stack
                  direction="row"
                  sx={{
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 1.5,
                  }}
                >
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 500, color: "text.secondary" }}
                  >
                    Recebimento {index + 1} de {payments.length}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={`Remover recebimento ${index + 1}`}
                    onClick={() => removePayment(payment.id)}
                  >
                    <DeleteOutlinedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              ) : null}

              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: { sm: "1fr 1fr 1fr" },
                }}
              >
                <CurrencyInput
                  id={`so-pay-amount-${payment.id}`}
                  label="Valor"
                  value={payment.amount}
                  onValueChange={(amount) =>
                    updatePayment(payment.id, { amount })
                  }
                />

                <FormControl fullWidth>
                  <InputLabel id={`so-pay-method-label-${payment.id}`}>
                    Forma
                  </InputLabel>
                  <Select
                    labelId={`so-pay-method-label-${payment.id}`}
                    id={`so-pay-method-${payment.id}`}
                    label="Forma"
                    value={payment.paymentMethodId}
                    onChange={(event) =>
                      handleMethodChange(payment.id, String(event.target.value))
                    }
                  >
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth>
                  <InputLabel id={`so-pay-account-label-${payment.id}`}>
                    Conta
                  </InputLabel>
                  <Select
                    labelId={`so-pay-account-label-${payment.id}`}
                    id={`so-pay-account-${payment.id}`}
                    label="Conta"
                    value={payment.bankAccountId}
                    onChange={(event) =>
                      updatePayment(payment.id, {
                        bankAccountId: String(event.target.value),
                      })
                    }
                  >
                    {bankAccounts.map((account) => (
                      <MenuItem key={account.id} value={account.id}>
                        {account.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {payment.cardPaymentType === "debit" ||
                payment.cardPaymentType === "credit" ? (
                  <FormControl fullWidth>
                    <InputLabel id={`so-pay-brand-label-${payment.id}`}>
                      Bandeira
                    </InputLabel>
                    <Select
                      labelId={`so-pay-brand-label-${payment.id}`}
                      id={`so-pay-brand-${payment.id}`}
                      label="Bandeira"
                      value={payment.brand}
                      onChange={(event) =>
                        updatePayment(payment.id, {
                          brand: String(event.target.value),
                        })
                      }
                    >
                      {CARD_BRAND_OPTIONS.map((brand) => (
                        <MenuItem key={brand.value} value={brand.value}>
                          {brand.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : null}

                {payment.cardPaymentType === "credit" ? (
                  <NumberSpinner
                    id={`so-pay-installments-${payment.id}`}
                    label="Parcelas"
                    min={1}
                    step={1}
                    value={payment.installments}
                    onValueChange={(installments) =>
                      updatePayment(payment.id, {
                        installments: installments ?? 1,
                      })
                    }
                  />
                ) : null}
              </Box>
            </Box>
          ))}

          <Button
            type="button"
            variant="text"
            startIcon={<AddIcon fontSize="small" />}
            onClick={addPayment}
            sx={{ alignSelf: "flex-start", px: 0 }}
          >
            Adicionar recebimento
          </Button>

          <Stack
            direction="row"
            sx={{
              alignItems: "center",
              justifyContent: "space-between",
              border: 1,
              borderRadius: 1,
              px: 1.5,
              py: 1,
              fontWeight: 500,
              ...remainingBannerSx(remaining),
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {remaining === 0
                ? "Recebimentos cobrem o total da OS"
                : remaining > 0
                  ? "Restante a receber"
                  : "Valor recebido a mais"}
            </Typography>
            <Typography
              variant="body2"
              sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
            >
              {formatCurrencyBRL(Math.abs(remaining))}
            </Typography>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button type="button" variant="outlined" onClick={onClose}>
          Cancelar
        </Button>
        <Button type="button" variant="contained" onClick={handleConfirm}>
          Confirmar e gerar venda
        </Button>
      </DialogActions>
    </>
  );
}
