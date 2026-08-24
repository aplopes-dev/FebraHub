"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";
import EditOutlined from "@mui/icons-material/EditOutlined";

import { useState } from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, ConfirmationDialog } from "@citybox/mui";
import type { PaymentMethod } from "@/features/card-contracts/types/card-contract";

const TYPE_LABELS: Record<string, string> = {
  pix: "Pix",
  debit: "Débito",
  credit: "Crédito",
};

const TYPE_COLORS: Record<string, string> = {
  pix: "#32BCAD",
  debit: "#2563EB",
  credit: "#7C3AED",
};

type PaymentMethodCardProps = {
  method: PaymentMethod;
  onEdit: () => void;
  onRemove: () => Promise<void>;
};

export function PaymentMethodCard({
  method,
  onEdit,
  onRemove,
}: PaymentMethodCardProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);

  function formatRate(val: number | null | undefined): string {
    if (val == null) return "—";
    return `${val.toFixed(1).replace(".", ",")}%`;
  }

  function formatCurrency(val: number | null | undefined): string {
    if (val == null || val === 0) return "Grátis";
    return `R$ ${val.toFixed(2).replace(".", ",")}`;
  }

  function formatDays(val: number | null | undefined): string {
    if (val == null) return "—";
    if (val === 0) return "Imediato";
    return `${val} dia${val !== 1 ? "s" : ""}`;
  }

  return (
    <Box
      sx={{
        p: 2,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          spacing={1.5}
          sx={{ alignItems: "flex-start", justifyContent: "space-between" }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                bgcolor: TYPE_COLORS[method.type] ?? "#666",
                flexShrink: 0,
              }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              {TYPE_LABELS[method.type] ?? method.type}
            </Typography>
            {method.brand && (
              <Chip
                label={method.brand}
                size="small"
                variant="outlined"
                sx={{ height: 22, fontSize: "0.75rem" }}
              />
            )}
          </Stack>

          <Stack direction="row" spacing={0.5}>
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={onEdit}
              aria-label="Editar método"
              sx={{ minWidth: 28, px: 0.5 }}
            >
              <EditOutlined sx={{ fontSize: 14 }} />
            </Button>
            <Button
              type="button"
              variant="text"
              size="small"
              onClick={() => setConfirmOpen(true)}
              aria-label="Remover método"
              sx={{ minWidth: 28, px: 0.5, color: "error.main" }}
            >
              <DeleteOutlined sx={{ fontSize: 14 }} />
            </Button>
          </Stack>
        </Stack>

        <Stack direction="row" spacing={3} sx={{ flexWrap: "wrap" }}>
          <Stack spacing={0}>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Taxa
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatRate(method.rate)}
            </Typography>
          </Stack>

          {method.type !== "credit" && (
            <Stack spacing={0}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Tarifa
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatCurrency(method.fee)}
              </Typography>
            </Stack>
          )}

          {method.type !== "credit" && (
            <Stack spacing={0}>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                Repasse
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {formatDays(method.settlementDays)}
              </Typography>
            </Stack>
          )}

          {method.type === "credit" && (
            <>
              <Stack spacing={0}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Parcelas
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {method.minInstallments} a {method.maxInstallments}
                </Typography>
              </Stack>
              <Stack spacing={0}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  1º pagamento
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDays(method.firstPaymentDays)}
                </Typography>
              </Stack>
              <Stack spacing={0}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Entre parcelas
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {formatDays(method.daysBetweenInstallments)}
                </Typography>
              </Stack>
            </>
          )}
        </Stack>

        {method.progressiveEnabled && method.progressiveTiers && method.progressiveTiers.length > 0 && (
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1,
              bgcolor: "action.hover",
            }}
          >
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", fontWeight: 600, display: "block", mb: 0.5 }}
            >
              Taxa progressiva
            </Typography>
            <Stack spacing={0.5}>
              {method.progressiveTiers.map((tier) => (
                <Typography key={tier.id} variant="caption" sx={{ color: "text.secondary" }}>
                  {tier.minInstallments}–{tier.maxInstallments} parcelas:{" "}
                  {formatRate(tier.rate)}
                </Typography>
              ))}
            </Stack>
          </Box>
        )}
      </Stack>

      <ConfirmationDialog
        open={confirmOpen}
        onCancel={() => {
          if (!confirmLoading) setConfirmOpen(false);
        }}
        title="Remover método?"
        description="Tem certeza que deseja remover este método de pagamento?"
        confirmLabel="Remover"
        cancelLabel="Cancelar"
        confirmColor="error"
        loading={confirmLoading}
        onConfirm={async () => {
          setConfirmLoading(true);
          try {
            await onRemove();
            setConfirmOpen(false);
          } finally {
            setConfirmLoading(false);
          }
        }}
      />
    </Box>
  );
}
