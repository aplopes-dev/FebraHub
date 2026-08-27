"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DatePicker, MenuItem, Select } from "@/ui";
import TextField from "@mui/material/TextField";
import { formSectionBoxSx } from "@/components/ui/form";
import {
  SALE_ORDER_STATUS_LABELS,
  SALE_ORDER_STATUS_ORDER,
} from "@/features/sales-orders/lib/sale-order-status";
import {
  formatSaleOrderChannelWithFulfillment,
  type PosDeliveryFulfillment,
} from "@/features/sales-orders/lib/sale-order-channels";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/sales-orders/lib/sale-order-form-values";
import type { SaleOrderSellerOption } from "@/features/sales-orders/types/sale-order-form";
import type {
  SaleOrderChannelId,
  SaleOrderStatus,
} from "@/features/sales-orders/types/sale-order";

type SaleOrderInfoPanelProps = {
  soldAt: string;
  status: SaleOrderStatus;
  sellerId: string;
  sellers: SaleOrderSellerOption[];
  channelId?: SaleOrderChannelId;
  posDeliveryOrderNumber?: number | null;
  posDeliveryFulfillment?: PosDeliveryFulfillment | null;
  onSoldAtChange: (soldAt: string) => void;
  onStatusChange: (status: SaleOrderStatus) => void;
  onSellerChange: (sellerId: string) => void;
  /** Trava o Status na opção atual (ex.: tela de Vendas, sempre "Fechado"). */
  statusLocked?: boolean;
  /** Todos os campos só leitura (venda/pedido cancelado ou com estoque baixado). */
  disabled?: boolean;
};

export function SaleOrderInfoPanel({
  soldAt,
  status,
  sellerId,
  sellers,
  channelId,
  posDeliveryOrderNumber,
  posDeliveryFulfillment,
  onSoldAtChange,
  onStatusChange,
  onSellerChange,
  statusLocked = false,
  disabled = false,
}: SaleOrderInfoPanelProps) {
  const soldDate = parseIsoDate(soldAt);
  const fieldsDisabled = disabled || statusLocked;

  return (
    <Box sx={{ ...formSectionBoxSx }}>
      <Stack spacing={2}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Informações da venda
        </Typography>

        {channelId ? (
          <TextField
            label="Canal"
            value={formatSaleOrderChannelWithFulfillment(
              channelId,
              posDeliveryFulfillment,
            )}
            disabled
            fullWidth
          />
        ) : null}

        {posDeliveryOrderNumber != null ? (
          <TextField
            label="Pedido delivery"
            value={`#${posDeliveryOrderNumber}`}
            disabled
            fullWidth
          />
        ) : null}

        <DatePicker
          label="Data da venda"
          value={soldDate}
          disabled={disabled}
          onChange={(date) => {
            if (date) onSoldAtChange(toIsoDate(date));
          }}
        />

        <FormControl fullWidth disabled={fieldsDisabled}>
          <InputLabel id="sale-order-status-label">Status</InputLabel>
          <Select
            labelId="sale-order-status-label"
            id="sale-order-status"
            label="Status"
            value={status}
            disabled={fieldsDisabled}
            onChange={(event) =>
              onStatusChange(event.target.value as SaleOrderStatus)
            }
          >
            {SALE_ORDER_STATUS_ORDER.map((item) => (
              <MenuItem key={item} value={item}>
                {SALE_ORDER_STATUS_LABELS[item]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl fullWidth disabled={disabled}>
          <InputLabel id="sale-order-seller-label">Vendedor</InputLabel>
          <Select
            labelId="sale-order-seller-label"
            id="sale-order-seller"
            label="Vendedor"
            value={sellerId}
            disabled={disabled}
            onChange={(event) => onSellerChange(String(event.target.value))}
          >
            {sellers.map((seller) => (
              <MenuItem key={seller.id} value={seller.id}>
                {seller.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </Box>
  );
}
