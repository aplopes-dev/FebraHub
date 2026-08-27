"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import { Button } from "@/ui";
import { PaymentMethodCard } from "@/features/card-contracts/components/payment-method-card";
import { PaymentMethodFormDialog } from "@/features/card-contracts/components/payment-method-form-dialog";
import type { PaymentMethod } from "@/features/card-contracts/types/card-contract";

type PaymentMethodsSectionProps = {
  methods: PaymentMethod[];
  onAdd: (
    method: Omit<PaymentMethod, "id">,
    onSuccess?: () => void,
  ) => void;
  onUpdate: (
    methodId: string,
    values: Omit<PaymentMethod, "id">,
    onSuccess?: () => void,
  ) => void;
  onRemove: (methodId: string) => Promise<void>;
  isSavingMethod?: boolean;
};

export function PaymentMethodsSection({
  methods,
  onAdd,
  onUpdate,
  onRemove,
  isSavingMethod = false,
}: PaymentMethodsSectionProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<
    PaymentMethod | undefined
  >(undefined);
  const [formNonce, setFormNonce] = useState(0);

  function handleOpenAdd() {
    setEditingMethod(undefined);
    setFormNonce((nonce) => nonce + 1);
    setDialogOpen(true);
  }

  function handleOpenEdit(method: PaymentMethod) {
    setEditingMethod(method);
    setFormNonce((nonce) => nonce + 1);
    setDialogOpen(true);
  }

  function handleSave(method: Omit<PaymentMethod, "id">) {
    const close = () => setDialogOpen(false);
    if (editingMethod) {
      onUpdate(editingMethod.id, method, close);
    } else {
      onAdd(method, close);
    }
  }

  const formKey = editingMethod
    ? `edit-${editingMethod.id}-${formNonce}`
    : `create-${formNonce}`;

  return (
    <>
      <Box
        component="section"
        sx={{
          display: "grid",
          gap: { xs: 3, lg: 5 },
          gridTemplateColumns: {
            lg: "minmax(16rem, 22rem) minmax(0, 1fr)",
          },
          alignItems: "start",
          minWidth: 0,
          width: "100%",
        }}
      >
        <Box
          component="header"
          sx={{
            pt: { lg: 0.5 },
            "& h2": {
              m: 0,
              fontSize: "1rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
            },
            "& p": {
              m: 0,
              mt: 0.5,
              fontSize: "0.875rem",
              color: "text.secondary",
            },
          }}
        >
          <Typography
            component="h2"
            variant="subtitle1"
            sx={{ fontWeight: 600 }}
          >
            Métodos de pagamento
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Adicione os métodos de pagamento aceitos pela maquininha e configure
            as taxas para cada um.
          </Typography>
        </Box>

        <Box
          sx={{
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "background.paper",
            p: 2.5,
            minWidth: 0,
          }}
        >
          <Stack spacing={2}>
            {methods.length === 0 ? (
              <Typography
                variant="body2"
                sx={{ color: "text.secondary", py: 2, textAlign: "center" }}
              >
                Nenhum método de pagamento cadastrado.
              </Typography>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "1fr 1fr",
                    lg: "1fr 1fr 1fr",
                  },
                }}
              >
                {methods.map((method) => (
                  <PaymentMethodCard
                    key={method.id}
                    method={method}
                    onEdit={() => handleOpenEdit(method)}
                    onRemove={() => onRemove(method.id)}
                  />
                ))}
              </Box>
            )}

            <Box>
              <Button
                type="button"
                variant="outlined"
                startIcon={<AddIcon fontSize="small" />}
                onClick={handleOpenAdd}
                disabled={isSavingMethod}
              >
                Adicionar método
              </Button>
            </Box>
          </Stack>
        </Box>
      </Box>

      <PaymentMethodFormDialog
        open={dialogOpen}
        onClose={() => {
          if (!isSavingMethod) setDialogOpen(false);
        }}
        onSave={handleSave}
        method={editingMethod}
        formKey={formKey}
        isSaving={isSavingMethod}
      />
    </>
  );
}
