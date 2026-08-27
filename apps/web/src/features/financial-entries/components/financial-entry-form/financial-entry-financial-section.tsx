"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import {
  CurrencyInput,
  DatePicker,
  FormControlLabel,
  FormField,
  Radio,
  RadioGroup,
  Select,
} from "@/ui";
import { SemanticBadge } from "@/components/ui/status";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { FinancialEntrySection } from "@/features/financial-entries/components/financial-entry-form/financial-entry-form-primitives";
import { computeEntryTotal } from "@/features/financial-entries/lib/financial-entry-form-values";
import { FINANCIAL_ENTRY_OPERATION_LABELS } from "@/features/financial-entries/types/financial-entry";
import type { FinancialEntryFormValues } from "@/features/financial-entries/lib/financial-entry-form-values";
import type { FinancialEntryOperation } from "@/features/financial-entries/types/financial-entry";

function formatCurrencyBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Bruto/taxa/líquido do motor de recebíveis do contrato de cartões
 * (`specs/erp/005-card-receivables-engine/`, User Story 5) — só presente em
 * lançamentos gerados pelo fechamento de uma venda no cartão/Pix.
 */
export type FinancialEntryCardSettlementInfo = {
  grossAmount: number | null;
  acquirerFee: number | null;
  fallback: boolean;
};

const OPERATION_ORDER: FinancialEntryOperation[] = ["receivable", "payable"];

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

type FinancialEntryFinancialSectionProps = {
  values: FinancialEntryFormValues;
  onFieldChange: <K extends keyof FinancialEntryFormValues>(
    field: K,
    value: FinancialEntryFormValues[K],
  ) => void;
  /** Lançamento vinculado a pedido de venda — formulário inteiro somente-leitura (FR-016). */
  readOnly?: boolean;
  /** Presente só em lançamentos gerados pelo motor de recebíveis do cartão. */
  cardSettlement?: FinancialEntryCardSettlementInfo | null;
};

export function FinancialEntryFinancialSection({
  values,
  onFieldChange,
  readOnly,
  cardSettlement,
}: FinancialEntryFinancialSectionProps) {
  const total = computeEntryTotal(values);
  const { data: bankAccounts = [] } = useBankAccountOptionsQuery();
  const grossAmount = cardSettlement?.grossAmount ?? null;
  const acquirerFee = cardSettlement?.acquirerFee ?? null;

  return (
    <FinancialEntrySection
      title="Financeiro"
      description="Preencha informações como valor, taxas, vencimento e conta associada."
    >
      {cardSettlement?.fallback ? (
        <Box>
          <SemanticBadge
            label="Gerado sem contrato de cartão aplicável"
            tone="warning"
          />
        </Box>
      ) : null}

      {grossAmount != null && acquirerFee != null ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            p: 2,
            borderRadius: 1,
            border: 1,
            borderColor: "divider",
            bgcolor: "action.hover",
          }}
        >
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Valor bruto da venda
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrencyBRL(grossAmount)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Taxa da adquirente
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrencyBRL(acquirerFee)}
            </Typography>
          </Box>
          <Box>
            <Typography variant="caption" sx={{ color: "text.secondary" }}>
              Valor líquido
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {formatCurrencyBRL(values.baseAmount)}
            </Typography>
          </Box>
        </Box>
      ) : null}

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
          Tipo de conta
        </Typography>
        <RadioGroup
          row
          value={values.operation}
          onChange={(event) =>
            onFieldChange("operation", event.target.value as FinancialEntryOperation)
          }
          sx={{ gap: 2, flexWrap: "wrap" }}
        >
          {OPERATION_ORDER.map((operation) => (
            <FormControlLabel
              key={operation}
              value={operation}
              control={<Radio disabled={readOnly} />}
              disabled={readOnly}
              label={FINANCIAL_ENTRY_OPERATION_LABELS[operation]}
              sx={{
                m: 0,
                px: 1.5,
                py: 1,
                borderRadius: 1,
                border: 1,
                borderColor:
                  values.operation === operation ? "primary.main" : "divider",
                bgcolor:
                  values.operation === operation ? "action.selected" : "transparent",
              }}
            />
          ))}
        </RadioGroup>
      </Box>

      <Box>
        <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
          Lançamento financeiro
        </Typography>
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
              id="fin-base-amount"
              value={values.baseAmount}
              onValueChange={(value) => onFieldChange("baseAmount", value)}
              disabled={readOnly}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Taxas/Despesas
            </Typography>
            <CurrencyInput
              id="fin-fees"
              value={values.fees}
              onValueChange={(value) => onFieldChange("fees", value)}
              disabled={readOnly}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Multas/Juros
            </Typography>
            <CurrencyInput
              id="fin-fines"
              value={values.fines}
              onValueChange={(value) => onFieldChange("fines", value)}
              disabled={readOnly}
            />
          </Box>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500, mb: 1 }}>
              Total
            </Typography>
            <CurrencyInput
              id="fin-total"
              value={total}
              onValueChange={() => {}}
              disabled
            />
          </Box>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
        }}
      >
        <FormControl fullWidth disabled={readOnly}>
          <InputLabel id="fin-bank-account-label">Conta</InputLabel>
          <Select
            labelId="fin-bank-account-label"
            id="fin-bank-account"
            label="Conta"
            value={values.bankAccountId}
            onChange={(event) =>
              onFieldChange("bankAccountId", event.target.value as string)
            }
          >
            <MenuItem value="">
              <em>Selecione uma opção</em>
            </MenuItem>
            {bankAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {account.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <DatePicker
          label="Data de competência"
          value={parseIsoDate(values.competenceDate)}
          onChange={(date) => {
            if (date) onFieldChange("competenceDate", toIsoDate(date));
          }}
          disabled={readOnly}
        />

        <DatePicker
          label="Data de vencimento"
          value={parseIsoDate(values.dueDate)}
          onChange={(date) => {
            if (date) onFieldChange("dueDate", toIsoDate(date));
          }}
          disabled={readOnly}
        />
      </Box>

      <Box>
        <FormField
          id="fin-description"
          label="Descrição"
          value={values.description}
          onChange={(event) =>
            onFieldChange("description", event.target.value.slice(0, 120))
          }
          placeholder="Ex.: Pagamento de fornecedor"
          multiline
          minRows={2}
          helperText={`${values.description.length}/120`}
          disabled={readOnly}
        />
      </Box>
    </FinancialEntrySection>
  );
}
