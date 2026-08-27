"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import { Button, Drawer, toast } from "@/ui";
import {
  createBankAccountApi,
  updateBankAccountApi,
} from "@/features/bank-accounts/api/bank-accounts.service";
import { BankAccountForm } from "@/features/bank-accounts/components/bank-account-form";
import type {
  BankAccount,
  BankAccountFormValues,
} from "@/features/bank-accounts/types/bank-account";

const FORM_ID = "bank-account-form";

type BankAccountCreateDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Presente = modo edição (PUT); ausente = criação (POST). */
  account?: BankAccount;
  onSaved?: () => void;
};

function toFormValues(account: BankAccount): BankAccountFormValues {
  return {
    bankCode: account.bankCode,
    name: account.name,
    initialBalance: account.initialBalance,
    openedAt: account.openedAt,
    unitIds: account.unitIds,
  };
}

export function BankAccountCreateDrawer({
  open,
  onOpenChange,
  account,
  onSaved,
}: BankAccountCreateDrawerProps) {
  const [isSaving, setIsSaving] = useState(false);
  const isEdit = Boolean(account);

  function handleClose() {
    if (!isSaving) onOpenChange(false);
  }

  async function handleSubmit(values: BankAccountFormValues) {
    setIsSaving(true);
    try {
      const saved = account
        ? await updateBankAccountApi(account.id, values)
        : await createBankAccountApi(values);
      toast.success(
        isEdit
          ? `Conta "${saved.name}" atualizada.`
          : `Conta "${saved.name}" criada.`,
      );
      onOpenChange(false);
      onSaved?.();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao salvar conta.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Drawer
      open={open}
      onClose={handleClose}
      title={isEdit ? "Editar conta bancária" : "Nova conta bancária"}
      width={480}
      footer={
        <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
          <Button
            type="button"
            variant="outlined"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="contained"
            loading={isSaving}
            disabled={isSaving}
          >
            Salvar
          </Button>
        </Stack>
      }
    >
      <BankAccountForm
        key={open ? account?.id ?? "new" : "closed"}
        formId={FORM_ID}
        onSubmit={handleSubmit}
        initialValues={account ? toFormValues(account) : undefined}
        disabled={isSaving}
      />
    </Drawer>
  );
}
