"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { toast } from "@citybox/mui";
import {
  Button,
  CurrencyInput,
  DatePicker,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormField,
  Select,
} from "@citybox/mui";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { useCreateBankTransferMutation } from "@/features/bank-accounts/hooks/use-bank-transfer-mutations";
import { useCostCenterOptionsQuery } from "@/features/cost-centers/hooks/use-cost-center-options-query";
import { usePaymentMethodOptionsQuery } from "@/features/payment-methods/hooks/use-payment-method-options-query";
import type { BankAccountOption } from "@/lib/option-types";
import type { CostCenterOption } from "@/features/cost-centers/api/cost-centers.service";

const NO_BANK_ACCOUNTS: BankAccountOption[] = [];
const NO_COST_CENTERS: CostCenterOption[] = [];
const NO_PAYMENT_METHODS: { id: string; name: string }[] = [];

type TransferDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Chamado após transferir com sucesso — refresh da lista, se aplicável. */
  onCompleted?: () => void;
};

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

export function TransferDialog({
  open,
  onOpenChange,
  onCompleted,
}: TransferDialogProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} maxWidth="sm" fullWidth>
      <TransferDialogBody
        key={open ? "open" : "closed"}
        onClose={() => onOpenChange(false)}
        onCompleted={onCompleted}
      />
    </Dialog>
  );
}

function TransferDialogBody({
  onClose,
  onCompleted,
}: {
  onClose: () => void;
  onCompleted?: () => void;
}) {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState(0);
  const [date, setDate] = useState(() => toIsoDate(new Date()));
  const [paymentMethod, setPaymentMethod] = useState("");
  const [costCenterId, setCostCenterId] = useState("");
  const [description, setDescription] = useState("");
  const { data: bankAccounts = NO_BANK_ACCOUNTS } = useBankAccountOptionsQuery();
  const { data: costCenters = NO_COST_CENTERS } = useCostCenterOptionsQuery();
  const { data: paymentMethods = NO_PAYMENT_METHODS } =
    usePaymentMethodOptionsQuery();
  const createTransfer = useCreateBankTransferMutation();

  async function handleConfirm() {
    if (!fromAccountId || !toAccountId) {
      toast.error("Selecione a conta de saída e a conta de entrada.");
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error("A conta de saída deve ser diferente da conta de entrada.");
      return;
    }
    if (amount <= 0) {
      toast.error("Informe o valor da transferência.");
      return;
    }
    if (!date) {
      toast.error("Informe a data da transferência.");
      return;
    }
    if (!paymentMethod) {
      toast.error("Selecione o método de pagamento.");
      return;
    }
    if (!costCenterId) {
      toast.error("Selecione o centro de custo.");
      return;
    }

    try {
      await createTransfer.mutateAsync({
        fromBankAccountId: fromAccountId,
        toBankAccountId: toAccountId,
        amountCents: Math.round(amount * 100),
        effectiveAt: date,
        paymentMethod,
        costCenterId,
        description: description.trim() || undefined,
      });
      toast.success("Transferência registrada com sucesso.");
      onClose();
      onCompleted?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao transferir.",
      );
    }
  }

  return (
    <>
      <DialogTitle>Transferência entre contas</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ color: "text.secondary", mb: 3 }}>
          Move um valor de uma conta bancária para outra — reflete de imediato no
          saldo e no extrato de ambas.
        </Typography>

        <Stack spacing={2.5}>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <FormControl fullWidth disabled={createTransfer.isPending}>
              <InputLabel id="transfer-from-label">Conta de saída</InputLabel>
              <Select
                labelId="transfer-from-label"
                id="transfer-from"
                label="Conta de saída"
                value={fromAccountId}
                onChange={(event) => setFromAccountId(event.target.value as string)}
              >
                {bankAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={createTransfer.isPending}>
              <InputLabel id="transfer-to-label">Conta de entrada</InputLabel>
              <Select
                labelId="transfer-to-label"
                id="transfer-to"
                label="Conta de entrada"
                value={toAccountId}
                onChange={(event) => setToAccountId(event.target.value as string)}
              >
                {bankAccounts.map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {account.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <CurrencyInput
              label="Valor"
              id="transfer-amount"
              value={amount}
              onValueChange={setAmount}
              disabled={createTransfer.isPending}
            />
            <DatePicker
              label="Data"
              value={parseIsoDate(date)}
              onChange={(next) => {
                if (next) setDate(toIsoDate(next));
              }}
              disabled={createTransfer.isPending}
            />
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            <FormControl fullWidth disabled={createTransfer.isPending}>
              <InputLabel id="transfer-payment-method-label">
                Método de pagamento
              </InputLabel>
              <Select
                labelId="transfer-payment-method-label"
                id="transfer-payment-method"
                label="Método de pagamento"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as string)
                }
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method.id} value={method.id}>
                    {method.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth disabled={createTransfer.isPending}>
              <InputLabel id="transfer-cost-center-label">Centro de custo</InputLabel>
              <Select
                labelId="transfer-cost-center-label"
                id="transfer-cost-center"
                label="Centro de custo"
                value={costCenterId}
                onChange={(event) => setCostCenterId(event.target.value as string)}
              >
                {costCenters.map((center) => (
                  <MenuItem key={center.id} value={center.id}>
                    {center.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>

          <FormField
            id="transfer-description"
            label="Descrição"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Ex.: Transferência para cobrir despesas da loja Orla."
            multiline
            minRows={2}
            disabled={createTransfer.isPending}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={createTransfer.isPending}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={() => void handleConfirm()}
          loading={createTransfer.isPending}
          disabled={createTransfer.isPending}
        >
          Transferir
        </Button>
      </DialogActions>
    </>
  );
}
