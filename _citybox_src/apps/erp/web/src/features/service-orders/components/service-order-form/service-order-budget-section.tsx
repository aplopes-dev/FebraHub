"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { alpha } from "@mui/material/styles";
import {
  CurrencyInput,
  DatePicker,
  FormField,
  Radio,
  RadioGroup,
} from "@citybox/mui";
import { ServiceOrderSection } from "@/features/service-orders/components/service-order-form/service-order-section";
import { SERVICE_ORDER_BUDGET_APPROVAL_LABELS } from "@/features/service-orders/types/service-order";
import type {
  ServiceOrderBudget,
  ServiceOrderBudgetApproval,
} from "@/features/service-orders/types/service-order";

const APPROVAL_ORDER: ServiceOrderBudgetApproval[] = [
  "pending",
  "approved",
  "rejected",
];

const APPROVAL_DESCRIPTIONS: Record<ServiceOrderBudgetApproval, string> = {
  pending: "O cliente ainda não deu o aceite no valor orçado.",
  approved: "O cliente autorizou a execução — o serviço pode começar.",
  rejected:
    "O cliente recusou o orçamento — cobre apenas a taxa de diagnóstico, se houver.",
};

function parseIsoDate(value: string | null): Date | undefined {
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

type ServiceOrderBudgetSectionProps = {
  budget: ServiceOrderBudget;
  onBudgetChange: <K extends keyof ServiceOrderBudget>(
    key: K,
    value: ServiceOrderBudget[K],
  ) => void;
};

export function ServiceOrderBudgetSection({
  budget,
  onBudgetChange,
}: ServiceOrderBudgetSectionProps) {
  return (
    <ServiceOrderSection
      title="Orçamento e aprovação"
      description="Registre o valor apresentado ao cliente e a decisão dele antes de executar o serviço — evita cobranças não autorizadas."
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "repeat(3, 1fr)" },
          }}
        >
          <CurrencyInput
            id="so-budget-amount"
            label="Valor orçado"
            value={budget.quotedAmount}
            onValueChange={(value) => onBudgetChange("quotedAmount", value)}
          />

          <DatePicker
            label="Data do orçamento"
            value={parseIsoDate(budget.quotedAt)}
            onChange={(date) => {
              if (date) onBudgetChange("quotedAt", toIsoDate(date));
            }}
            id="so-budget-date"
            placeholder="Selecionar data"
          />

          <CurrencyInput
            id="so-diagnosis-fee"
            label="Taxa de diagnóstico"
            value={budget.diagnosisFee}
            onValueChange={(value) => onBudgetChange("diagnosisFee", value)}
          />
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
            Decisão do cliente
          </Typography>
          <RadioGroup
            value={budget.approval}
            onChange={(event) => {
              const approval = event.target.value as ServiceOrderBudgetApproval;
              onBudgetChange("approval", approval);
              if (approval !== "pending" && !budget.decidedAt) {
                onBudgetChange("decidedAt", toIsoDate(new Date()));
              }
            }}
          >
            <Stack spacing={1.5}>
              {APPROVAL_ORDER.map((approval) => {
                const isActive = budget.approval === approval;
                return (
                  <FormControlLabel
                    key={approval}
                    value={approval}
                    control={<Radio sx={{ mt: 0.25 }} />}
                    label={
                      <Stack spacing={0.25} sx={{ py: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {SERVICE_ORDER_BUDGET_APPROVAL_LABELS[approval]}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: "text.secondary" }}
                        >
                          {APPROVAL_DESCRIPTIONS[approval]}
                        </Typography>
                      </Stack>
                    }
                    sx={{
                      m: 0,
                      alignItems: "flex-start",
                      borderRadius: 2,
                      border: 1,
                      borderColor: isActive ? "primary.main" : "divider",
                      bgcolor: isActive
                        ? (theme) => alpha(theme.palette.primary.main, 0.06)
                        : "transparent",
                      px: 1.5,
                      py: 1,
                      transition:
                        "border-color 0.2s ease, background-color 0.2s ease",
                    }}
                  />
                );
              })}
            </Stack>
          </RadioGroup>
        </Box>

        {budget.approval !== "pending" ? (
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { sm: "minmax(10rem, 14rem) minmax(0, 1fr)" },
            }}
          >
            <DatePicker
              label="Data da decisão"
              value={parseIsoDate(budget.decidedAt)}
              onChange={(date) => {
                if (date) onBudgetChange("decidedAt", toIsoDate(date));
              }}
              id="so-decision-date"
              placeholder="Selecionar data"
            />
            <FormField
              id="so-decision-notes"
              label="Quem aprovou / observações"
              value={budget.decisionNotes}
              onChange={(event) =>
                onBudgetChange("decisionNotes", event.target.value)
              }
              placeholder="Ex.: Aprovado por telefone pela própria cliente."
              multiline
              minRows={2}
            />
          </Box>
        ) : null}
      </Stack>
    </ServiceOrderSection>
  );
}
