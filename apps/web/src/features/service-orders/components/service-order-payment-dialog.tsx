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
  Select,
  toast,
} from "@/ui";
import {
  computeServiceOrderTotal,
  formatCurrencyBRL,
} from "@/features/service-orders/lib/service-order-totals";
import { createLocalId } from "@/features/service-orders/lib/service-order-form-values";
import { useServiceOrderMutations } from "@/features/service-orders/hooks/use-service-order-mutations";
import { MOCK_PAYMENT_METHODS } from "@/features/sales-orders/data/mock-payment-methods";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import type { ServiceOrder } from "@/features/service-orders/types/service-order";

type PaymentRow = {
  id: string;
  amount: number;
  paymentMethodId: string;
  bankAccountId: string;
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
  const [payments, setPayments] = useState<PaymentRow[]>(() => [
    {
      id: createLocalId("pay"),
      amount: total,
      paymentMethodId: "pm-dinheiro",
      bankAccountId: "",
    },
  ]);

  const received =
    Math.round(payments.reduce((acc, payment) => acc + payment.amount, 0) * 100) /
    100;
  const remaining = Math.round((total - received) * 100) / 100;

  function addPayment() {
    setPayments((prev) => [
      ...prev,
      {
        id: createLocalId("pay"),
        amount: Math.max(0, remaining),
        paymentMethodId: "pm-dinheiro",
        bankAccountId: "",
      },
    ]);
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
    if (remaining > 0) {
      toast.error(
        `Ainda faltam ${formatCurrencyBRL(remaining)} para cobrir o total da OS.`,
      );
      return;
    }

    mutations.generateSale.mutate(order.id, {
      onSuccess: (generated) => {
        toast.success(
          `${order.code} concluída — venda #${generated.saleNumber} gerada.`,
        );
        onClose();
        onCompleted?.();
      },
    });
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
                      updatePayment(payment.id, {
                        paymentMethodId: String(event.target.value),
                      })
                    }
                  >
                    {MOCK_PAYMENT_METHODS.map((method) => (
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
