"use client";

import { useState } from "react";
import Stack from "@mui/material/Stack";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  toast,
} from "@citybox/mui";
import { CustomerQuickCreateAddressFields } from "@/features/customers/components/customer-quick-create-address-fields";
import { CustomerQuickCreateIdentityFields } from "@/features/customers/components/customer-quick-create-identity-fields";
import {
  createEmptyQuickCreateValues,
  hasAnyAddressField,
  type CustomerQuickCreateValues,
} from "@/features/customers/components/customer-quick-create-types";
import { toSaveCustomerPayload } from "@/features/customers/api/customer.mapper";
import { useCreateCustomerMutation } from "@/features/customers/hooks/use-customer-mutations";
import { createEmptyCustomerFormValues } from "@/features/customers/services/customer.service";
import { createEmptyAddress } from "@/features/customers/types/customer-form";
import type { Customer } from "@/features/customers/types/customer";

export type { CustomerQuickCreateValues } from "@/features/customers/components/customer-quick-create-types";

type CustomerQuickCreateDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
};

export function CustomerQuickCreateDialog({
  open,
  onOpenChange,
  onCreated,
}: CustomerQuickCreateDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => onOpenChange(false)}
      maxWidth="sm"
      fullWidth
      scroll="paper"
    >
      <CustomerQuickCreateDialogBody
        key={open ? "open" : "closed"}
        onOpenChange={onOpenChange}
        onCreated={onCreated}
      />
    </Dialog>
  );
}

function CustomerQuickCreateDialogBody({
  onOpenChange,
  onCreated,
}: {
  onOpenChange: (open: boolean) => void;
  onCreated: (customer: Customer) => void;
}) {
  const [values, setValues] = useState(createEmptyQuickCreateValues);
  const createMutation = useCreateCustomerMutation();

  function patchField<K extends keyof Omit<CustomerQuickCreateValues, "address">>(
    field: K,
    value: CustomerQuickCreateValues[K],
  ) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function patchAddress(
    field: keyof CustomerQuickCreateValues["address"],
    value: string,
  ) {
    setValues((prev) => ({
      ...prev,
      address: { ...prev.address, [field]: value },
    }));
  }

  function patchAddressMany(
    partial: Partial<CustomerQuickCreateValues["address"]>,
  ) {
    setValues((prev) => ({
      ...prev,
      address: { ...prev.address, ...partial },
    }));
  }

  function handleSave() {
    const name = values.name.trim();
    if (!name) {
      toast.error("Informe o nome do cliente.");
      return;
    }

    const formValues = createEmptyCustomerFormValues();
    formValues.name = name;
    formValues.personType = "fisica";
    formValues.document = values.cpf.trim();
    formValues.phone = values.phone.trim();
    formValues.email = values.email.trim();
    formValues.stage = "active";

    if (hasAnyAddressField(values.address)) {
      formValues.addresses = [
        {
          ...createEmptyAddress("principal"),
          ...values.address,
        },
      ];
    }

    createMutation.mutate(toSaveCustomerPayload(formValues), {
      onSuccess: (created) => {
        onCreated(created);
        onOpenChange(false);
      },
    });
  }

  return (
    <>
      <DialogTitle sx={{ pb: 0.5 }}>Novo cliente</DialogTitle>
      <DialogContent sx={{ pt: 1.5 }}>
        <DialogContentText sx={{ mb: 2.5 }}>
          Cadastro rápido para vincular ao pedido. Só o nome é obrigatório.
        </DialogContentText>

        <Stack spacing={2.5}>
          <CustomerQuickCreateIdentityFields
            values={values}
            onPatchField={patchField}
          />
          <CustomerQuickCreateAddressFields
            address={values.address}
            onPatchAddress={patchAddress}
            onPatchAddressMany={patchAddressMany}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          disabled={createMutation.isPending}
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          disabled={!values.name.trim()}
          loading={createMutation.isPending}
          onClick={handleSave}
        >
          Salvar
        </Button>
      </DialogActions>
    </>
  );
}
