"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Typography from "@mui/material/Typography";
import { MenuItem, NumberInput, Select } from "@/ui";
import type { PurchaseLineStatus } from "@/features/purchases/types/purchase";

export type ReceiveLineDraft = {
  productId: string;
  quantity: number;
  status: Extract<PurchaseLineStatus, "received" | "cancelled">;
};

type PurchaseReceiveLineRowProps = {
  draft: ReceiveLineDraft;
  name: string;
  sku: string;
  onStatusChange: (status: ReceiveLineDraft["status"]) => void;
  onQuantityChange: (quantity: number) => void;
};

export function PurchaseReceiveLineRow({
  draft,
  name,
  sku,
  onStatusChange,
  onQuantityChange,
}: PurchaseReceiveLineRowProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.5,
        gridTemplateColumns: { xs: "1fr", sm: "1fr 9rem 9rem" },
        alignItems: { sm: "end" },
        p: 1.5,
        borderRadius: 1,
        border: 1,
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
          {name}
        </Typography>
        <Typography variant="caption" sx={{ color: "text.secondary" }}>
          {sku}
        </Typography>
      </Box>

      <FormControl fullWidth>
        <InputLabel id={`receive-status-${draft.productId}`}>
          Situação
        </InputLabel>
        <Select
          labelId={`receive-status-${draft.productId}`}
          label="Situação"
          value={draft.status}
          onChange={(event) =>
            onStatusChange(event.target.value as ReceiveLineDraft["status"])
          }
        >
          <MenuItem value="received">Recebido</MenuItem>
          <MenuItem value="cancelled">Cancelado</MenuItem>
        </Select>
      </FormControl>

      <NumberInput
        label="Qtd. recebida"
        value={draft.quantity}
        minValue={0}
        step={1}
        disabled={draft.status === "cancelled"}
        onValueChange={(value) => onQuantityChange(Math.max(0, value))}
        aria-label={`Quantidade recebida de ${name}`}
        sx={{ width: "100%" }}
      />
    </Box>
  );
}
