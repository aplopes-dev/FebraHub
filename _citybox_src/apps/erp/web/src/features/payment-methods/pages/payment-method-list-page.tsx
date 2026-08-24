"use client";

import { useMemo, useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { Button, PageHeader, ScrollArea, toast } from "@citybox/mui";
import { FormSection } from "@/components/ui/form";
import { selectPaymentMethodGroups } from "@/features/payment-methods/api/payment-method.mapper";
import { PaymentMethodFormDialog } from "@/features/payment-methods/components/payment-method-form-dialog";
import { PaymentMethodList } from "@/features/payment-methods/components/payment-method-list";
import { PaymentMethodRowActions } from "@/features/payment-methods/components/payment-method-row-actions";
import {
  DEFAULT_PAYMENT_METHOD_FISCAL_CODE,
  DEFAULT_PAYMENT_METHOD_INSTALLMENT_PERMISSION,
} from "@/features/payment-methods/data/payment-method-options";
import {
  useCreatePaymentMethodMutation,
  useDeletePaymentMethodMutation,
  useUpdatePaymentMethodMutation,
} from "@/features/payment-methods/hooks/use-payment-method-mutations";
import { usePaymentMethodsQuery } from "@/features/payment-methods/hooks/use-payment-method-queries";
import type {
  PaymentMethod,
  PaymentMethodFormValues,
} from "@/features/payment-methods/types/payment-method";

type DialogState = {
  open: boolean;
  mode: "create" | "edit";
  paymentMethodId?: string;
  initialValues: PaymentMethodFormValues;
  formKey: string;
};

function createEmptyFormValues(): PaymentMethodFormValues {
  return {
    name: "",
    fiscalCode: DEFAULT_PAYMENT_METHOD_FISCAL_CODE,
    installmentPermission: DEFAULT_PAYMENT_METHOD_INSTALLMENT_PERMISSION,
  };
}

function toFormValues(method: PaymentMethod): PaymentMethodFormValues {
  return {
    name: method.name,
    fiscalCode: method.fiscalCode,
    installmentPermission: method.installmentPermission,
  };
}

export function PaymentMethodListPage() {
  const { data: methods = [] } = usePaymentMethodsQuery();
  const groups = useMemo(() => selectPaymentMethodGroups(methods), [methods]);

  const createMutation = useCreatePaymentMethodMutation();
  const updateMutation = useUpdatePaymentMethodMutation();
  const deleteMutation = useDeletePaymentMethodMutation();
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const [dialog, setDialog] = useState<DialogState>(() => ({
    open: false,
    mode: "create",
    initialValues: createEmptyFormValues(),
    formKey: "closed",
  }));

  function openCreate() {
    setDialog({
      open: true,
      mode: "create",
      initialValues: createEmptyFormValues(),
      formKey: `create-${Date.now()}`,
    });
  }

  function openEdit(method: PaymentMethod) {
    setDialog({
      open: true,
      mode: "edit",
      paymentMethodId: method.id,
      initialValues: toFormValues(method),
      formKey: `edit-${method.id}-${Date.now()}`,
    });
  }

  function closeDialog() {
    setDialog((prev) => ({ ...prev, open: false }));
  }

  function handleSave(values: PaymentMethodFormValues) {
    if (!values.name.trim()) {
      toast.error("Informe o nome da forma de pagamento.");
      return;
    }

    // Duplicidade de nome é validada pela API (409) — o toast de erro da
    // mutation já cobre esse caso, sem checagem duplicada aqui.
    if (dialog.mode === "create") {
      createMutation.mutate(
        {
          name: values.name.trim(),
          fiscalCode: values.fiscalCode,
          installmentPermission: values.installmentPermission,
        },
        { onSuccess: closeDialog },
      );
      return;
    }

    if (!dialog.paymentMethodId) return;

    updateMutation.mutate(
      {
        id: dialog.paymentMethodId,
        payload: {
          name: values.name.trim(),
          fiscalCode: values.fiscalCode,
          installmentPermission: values.installmentPermission,
        },
      },
      { onSuccess: closeDialog },
    );
  }

  function handleDelete(method: PaymentMethod) {
    return deleteMutation.mutateAsync(method.id);
  }

  return (
    // Full-bleed + ScrollArea: o `main` do shell é `overflow: hidden`, então a
    // área rolável tem que nascer aqui (mesmo padrão de `company-settings`).
    // O PageHeader fica fora do scroll para "Nova forma de pagamento" não sumir.
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        minWidth: 0,
        overflow: "hidden",
        m: -3,
        width: (theme) => `calc(100% + ${theme.spacing(6)})`,
        maxWidth: "none",
      }}
    >
      <PageHeader
        sx={{ flexShrink: 0, mb: 0, px: 3, pt: 3, pb: 2 }}
        title="Formas de pagamento"
        actions={
          <Button
            type="button"
            variant="contained"
            startIcon={<AddIcon fontSize="small" />}
            onClick={openCreate}
          >
            Nova forma de pagamento
          </Button>
        }
      />

      <ScrollArea sx={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <Box sx={{ px: 3, pb: 4, minWidth: 0 }}>
          <FormSection
            title="Tipos de pagamento"
            description="Ative todas as formas de pagamento disponíveis em seu negócio e configure as bandeiras de cartão aceitas."
          >
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Formas de pagamentos disponíveis no seu negócio.
            </Typography>
            <PaymentMethodList methods={groups.system} />

            <Typography
              variant="body2"
              sx={{ color: "text.secondary", mt: 1.5 }}
            >
              Formas de pagamentos criadas por você disponíveis no seu negócio.
            </Typography>

            {groups.custom.length > 0 ? (
              <PaymentMethodList
                methods={groups.custom}
                renderActions={(method) => (
                  <PaymentMethodRowActions
                    method={method}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                )}
              />
            ) : (
              <Box
                sx={{
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  px: 2,
                  py: 3,
                  textAlign: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Você ainda não criou nenhuma forma de pagamento personalizada.
                </Typography>
              </Box>
            )}
          </FormSection>
        </Box>
      </ScrollArea>

      <PaymentMethodFormDialog
        open={dialog.open}
        mode={dialog.mode}
        initialValues={dialog.initialValues}
        formKey={dialog.formKey}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
        onSave={handleSave}
        isSaving={isSaving}
      />
    </Box>
  );
}
