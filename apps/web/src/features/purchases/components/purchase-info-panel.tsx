"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import {
  Button,
  DatePicker,
  FormField,
  Input,
  MenuItem,
  Select,
} from "@/ui";
import { formSectionBoxSx } from "@/components/ui/form/form-section-styles";
import {
  formatCurrencyBRL,
  parseIsoDate,
  toIsoDate,
} from "@/features/purchases/lib/purchase-form-values";
import {
  PURCHASE_NOTES_MAX_LENGTH,
  PURCHASE_STATUS_LABELS,
  type PurchaseDeliveryStatus,
  type PurchaseExtras,
  type PurchaseFormValues,
} from "@/features/purchases/types/purchase";

type PurchaseInfoPanelProps = {
  values: PurchaseFormValues;
  onPurchasedAtChange: (purchasedAt: string) => void;
  onSeriesChange: (series: string) => void;
  onInvoiceNumberChange: (invoiceNumber: string) => void;
  onNotesChange: (notes: string) => void;
  onDeliveryStatusChange: (status: PurchaseDeliveryStatus) => void;
  onOpenExtras: () => void;
};

function extrasSummary(extras: PurchaseExtras): string {
  const parts: string[] = [];
  if (extras.freight > 0) {
    parts.push(`Frete ${formatCurrencyBRL(extras.freight)}`);
  }
  if (extras.discounts > 0) {
    parts.push(`Desc. ${formatCurrencyBRL(extras.discounts)}`);
  }
  if (extras.otherExpenses > 0) {
    parts.push(`Desp. ${formatCurrencyBRL(extras.otherExpenses)}`);
  }
  return parts.length > 0 ? parts.join(" · ") : "Nenhum valor informado";
}

export function PurchaseInfoPanel({
  values,
  onPurchasedAtChange,
  onSeriesChange,
  onInvoiceNumberChange,
  onNotesChange,
  onDeliveryStatusChange,
  onOpenExtras,
}: PurchaseInfoPanelProps) {
  const purchasedDate = parseIsoDate(values.purchasedAt);

  return (
    <Box sx={formSectionBoxSx}>
      <Stack spacing={2.5}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
          Informações da compra
        </Typography>

        <DatePicker
          label="Data da compra"
          value={purchasedDate}
          onChange={(date) => {
            if (date) onPurchasedAtChange(toIsoDate(date));
          }}
          id="purchase-date"
        />

        <FormField
          id="purchase-series"
          label="Série"
          value={values.series}
          onChange={(event) => onSeriesChange(event.target.value)}
          placeholder="Série"
        />

        <FormField
          id="purchase-invoice"
          label="Número da NF"
          value={values.invoiceNumber}
          onChange={(event) => onInvoiceNumberChange(event.target.value)}
          placeholder="Número da NF"
        />

        <FormControl fullWidth>
          <InputLabel id="purchase-status-label">Status da entrega</InputLabel>
          <Select
            labelId="purchase-status-label"
            id="purchase-status"
            label="Status da entrega"
            value={values.deliveryStatus}
            onChange={(event) =>
              onDeliveryStatusChange(event.target.value as PurchaseDeliveryStatus)
            }
          >
            {(Object.keys(PURCHASE_STATUS_LABELS) as PurchaseDeliveryStatus[]).map(
              (status) => (
                <MenuItem key={status} value={status}>
                  {PURCHASE_STATUS_LABELS[status]}
                </MenuItem>
              ),
            )}
          </Select>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.75 }}>
            Se estiver Recebido, ao salvar você confirma os itens e as
            quantidades que entram no estoque.
          </Typography>
        </FormControl>

        <Input
          id="purchase-notes"
          label="Observações"
          value={values.notes}
          onChange={(event) => onNotesChange(event.target.value)}
          placeholder="Observações da compra"
          multiline
          minRows={3}
          slotProps={{ htmlInput: { maxLength: PURCHASE_NOTES_MAX_LENGTH } }}
        />

        <Box
          sx={{
            p: 1.5,
            borderRadius: 1,
            border: 1,
            borderStyle: "dashed",
            borderColor: "divider",
          }}
        >
          <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Frete e despesas
              </Typography>
              <Typography variant="caption" sx={{ color: "text.secondary" }}>
                {extrasSummary(values.extras)}
              </Typography>
            </Box>
            <Button
              type="button"
              variant="outlined"
              startIcon={<LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />}
              onClick={onOpenExtras}
              sx={{ flexShrink: 0 }}
            >
              Informar
            </Button>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}
