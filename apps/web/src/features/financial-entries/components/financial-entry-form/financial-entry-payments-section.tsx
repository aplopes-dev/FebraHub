"use client";

import DeleteOutlined from "@mui/icons-material/DeleteOutlined";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import AddIcon from "@mui/icons-material/Add";
import {
  Button,
  CurrencyInput,
  DatePicker,
  Select,
} from "@/ui";
import { FinancialEntrySection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-primitives";
import { CARD_BRAND_OPTIONS } from "@/features/card-contracts/data/card-brands";
import {
  computeEntryTotal,
  sumPayments,
  type FinancialEntryFormValues,
} from "@/features/financial-entries/lib/financial-entry-form-values";
import { formatCurrencyBRL } from "@/features/financial-entries/lib/financial-entry-format";
import type { FinancialEntryPayment } from "@/features/financial-entries/types/financial-entry";

const NO_PAYMENT_METHODS: { id: string; name: string }[] = [];

function parseIsoDate(value: string): Date | undefined {
  if (!value) return undefined;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day, 12);
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Pagamentos antigos podem ter uma Bandeira em texto livre (do campo
 * `Autocomplete freeSolo` anterior a US9) que não corresponde a nenhuma
 * opção do catálogo fechado — continua exibida como opção extra somente
 * para não sumir da tela, sem virar uma opção válida para escolha nova.
 */
function isUnknownCardBrand(cardBrandId: string | null): boolean {
  if (!cardBrandId) return false;
  return !CARD_BRAND_OPTIONS.some((brand) => brand.value === cardBrandId);
}

type FinancialEntryPaymentsSectionProps = {
  values: FinancialEntryFormValues;
  onAdd: () => void;
  onRemove: (paymentId: string) => void;
  onUpdate: (paymentId: string, patch: Partial<FinancialEntryPayment>) => void;
  readOnly?: boolean;
};

export function FinancialEntryPaymentsSection({
  values,
  onAdd,
  onRemove,
  onUpdate,
  readOnly,
}: FinancialEntryPaymentsSectionProps) {
  const total = computeEntryTotal(values);
  const paid = sumPayments(values.payments);
  const remaining = Math.round((total - paid) * 100) / 100;
  const paymentMethods = NO_PAYMENT_METHODS;

  const remainingColor =
    remaining === 0 ? "success.main" : remaining > 0 ? "warning.main" : "error.main";
  const remainingBg =
    remaining === 0
      ? "success.main"
      : remaining > 0
        ? "warning.main"
        : "error.main";

  return (
    <FinancialEntrySection
      title="Pagamentos"
      description="Adicione as formas como este lançamento foi pago ou recebido — é possível dividir entre datas e métodos diferentes."
    >
      <Stack spacing={2.5}>
        {values.payments.map((payment, index) => (
          <Box
            key={payment.id}
            sx={{
              pt: index > 0 ? 2 : 0,
              borderTop: index > 0 ? 1 : 0,
              borderColor: "divider",
            }}
          >
            {values.payments.length > 1 ? (
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", justifyContent: "space-between", mb: 1.5 }}
              >
                <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                  Pagamento {index + 1} de {values.payments.length}
                </Typography>
                <IconButton
                  size="small"
                  disabled={readOnly}
                  aria-label={`Remover pagamento ${index + 1}`}
                  onClick={() => onRemove(payment.id)}
                >
                  <DeleteOutlined sx={{ fontSize: 16 }} />
                </IconButton>
              </Stack>
            ) : null}

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(4, minmax(0, 1fr))",
                },
              }}
            >
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Valor
                </Typography>
                <CurrencyInput
                  id={`fin-pay-amount-${payment.id}`}
                  value={payment.amount}
                  onValueChange={(amount) => onUpdate(payment.id, { amount })}
                  disabled={readOnly}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Data
                </Typography>
                <DatePicker
                  value={parseIsoDate(payment.paidAt)}
                  onChange={(date) => {
                    if (date) onUpdate(payment.id, { paidAt: toIsoDate(date) });
                  }}
                  disabled={readOnly}
                />
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Forma de pagamento
                </Typography>
                <FormControl fullWidth disabled={readOnly}>
                  <Select
                    id={`fin-pay-method-${payment.id}`}
                    value={payment.paymentMethodId}
                    onChange={(event) =>
                      onUpdate(payment.id, {
                        paymentMethodId: event.target.value as string,
                      })
                    }
                  >
                    <MenuItem value="">
                      <em>Selecione uma opção</em>
                    </MenuItem>
                    {paymentMethods.map((method) => (
                      <MenuItem key={method.id} value={method.id}>
                        {method.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
                  Bandeira
                </Typography>
                <FormControl fullWidth disabled={readOnly}>
                  <Select
                    id={`fin-pay-brand-${payment.id}`}
                    value={payment.cardBrandId ?? ""}
                    onChange={(event) =>
                      onUpdate(payment.id, {
                        cardBrandId: (event.target.value as string) || null,
                      })
                    }
                  >
                    <MenuItem value="">
                      <em>Nenhuma (se não for cartão)</em>
                    </MenuItem>
                    {isUnknownCardBrand(payment.cardBrandId) ? (
                      <MenuItem value={payment.cardBrandId as string}>
                        {payment.cardBrandId} (valor histórico)
                      </MenuItem>
                    ) : null}
                    {CARD_BRAND_OPTIONS.map((brand) => (
                      <MenuItem key={brand.value} value={brand.value}>
                        {brand.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        ))}

        <Button
          type="button"
          variant="text"
          startIcon={<AddIcon fontSize="small" />}
          onClick={onAdd}
          disabled={readOnly}
          sx={{ alignSelf: "flex-start", px: 0 }}
        >
          Adicionar pagamento
        </Button>

        <Paper
          variant="outlined"
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            px: 1.5,
            py: 1.25,
            bgcolor: remainingBg,
            opacity: 0.08,
            borderColor: remainingColor,
            "& .remaining-text": { color: remainingColor, opacity: 1 },
          }}
        >
          <Typography variant="body2" className="remaining-text" sx={{ fontWeight: 600 }}>
            {remaining === 0
              ? "Pagamentos cobrem o total do lançamento"
              : remaining > 0
                ? "Restante a pagar/receber"
                : "Valor pago/recebido a mais"}
          </Typography>
          <Typography variant="body2" className="remaining-text" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {formatCurrencyBRL(Math.abs(remaining))}
          </Typography>
        </Paper>
      </Stack>
    </FinancialEntrySection>
  );
}
