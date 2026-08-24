"use client";

import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import InputLabel from "@mui/material/InputLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import {
  DatePicker,
  MenuItem,
  NumberInput,
  Radio,
  RadioGroup,
  Select,
} from "@citybox/mui";
import { SalesContractSection } from "@/features/sales-contracts/components/sales-contract-section";
import {
  RECURRENCE_FREQUENCY_LABELS,
  RECURRENCE_FREQUENCY_ORDER,
} from "@/features/sales-contracts/lib/sales-contract-labels";
import {
  parseIsoDate,
  toIsoDate,
} from "@/features/sales-contracts/lib/sales-contract-form-values";
import type { SalesContractFormValues } from "@/features/sales-contracts/types/sales-contract-form";
import type { PaymentMethodOption } from "@/lib/option-types";
import type { RecurrenceDuration } from "@/features/sales-contracts/types/sales-contract";

type SalesContractPaymentSectionProps = {
  values: SalesContractFormValues;
  paymentMethods: PaymentMethodOption[];
  onFieldChange: <K extends keyof SalesContractFormValues>(
    key: K,
    value: SalesContractFormValues[K],
  ) => void;
};

export function SalesContractPaymentSection({
  values,
  paymentMethods,
  onFieldChange,
}: SalesContractPaymentSectionProps) {
  return (
    <SalesContractSection
      title="Pagamento e recorrência"
      description="Configure o primeiro vencimento, a frequência das cobranças e a forma de pagamento. Ao salvar, as parcelas são geradas automaticamente."
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { sm: "1fr 1fr" },
          }}
        >
          <DatePicker
            label="Primeiro vencimento"
            value={parseIsoDate(values.firstDueDate)}
            onChange={(date) => {
              if (date) onFieldChange("firstDueDate", toIsoDate(date));
            }}
            id="contract-first-due"
          />

          <FormControl fullWidth>
            <InputLabel id="contract-frequency-label">
              Frequência de repetição
            </InputLabel>
            <Select
              labelId="contract-frequency-label"
              id="contract-frequency"
              label="Frequência de repetição"
              value={values.frequency}
              onChange={(event) =>
                onFieldChange(
                  "frequency",
                  event.target.value as SalesContractFormValues["frequency"],
                )
              }
            >
              {RECURRENCE_FREQUENCY_ORDER.map((frequency) => (
                <MenuItem key={frequency} value={frequency}>
                  {RECURRENCE_FREQUENCY_LABELS[frequency]}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Box>
          <Typography variant="body2" sx={{ fontWeight: 500, mb: 1.5 }}>
            Duração da recorrência
          </Typography>
          <RadioGroup
            value={values.durationMode}
            onChange={(event) =>
              onFieldChange(
                "durationMode",
                event.target.value as RecurrenceDuration["mode"],
              )
            }
          >
            <FormControlLabel
              value="forever"
              control={<Radio />}
              label="Para sempre"
            />
            <FormControlLabel
              value="until_date"
              control={<Radio />}
              label={
                <Stack spacing={1} sx={{ py: 0.5 }}>
                  <Typography variant="body2">Até a data</Typography>
                  {values.durationMode === "until_date" ? (
                    <DatePicker
                      label="Data limite"
                      value={parseIsoDate(values.durationUntilDate)}
                      onChange={(date) => {
                        if (date)
                          onFieldChange("durationUntilDate", toIsoDate(date));
                      }}
                      id="contract-duration-until"
                    />
                  ) : null}
                </Stack>
              }
              sx={{ alignItems: "flex-start", ml: 0 }}
            />
            <FormControlLabel
              value="times"
              control={<Radio />}
              label={
                <Stack spacing={1} sx={{ py: 0.5 }}>
                  <Typography variant="body2">Algumas vezes</Typography>
                  {values.durationMode === "times" ? (
                    <NumberInput
                      label="Quantidade de parcelas"
                      value={values.durationTimes}
                      minValue={1}
                      step={1}
                      onValueChange={(value) =>
                        onFieldChange("durationTimes", Math.max(1, value))
                      }
                      sx={{ maxWidth: 200 }}
                    />
                  ) : null}
                </Stack>
              }
              sx={{ alignItems: "flex-start", ml: 0 }}
            />
          </RadioGroup>
        </Box>

        <FormControl fullWidth>
          <InputLabel id="contract-payment-method-label">
            Forma de pagamento
          </InputLabel>
          <Select
            labelId="contract-payment-method-label"
            id="contract-payment-method"
            label="Forma de pagamento"
            value={values.paymentMethodId}
            onChange={(event) =>
              onFieldChange("paymentMethodId", String(event.target.value))
            }
          >
            {paymentMethods.map((method) => (
              <MenuItem key={method.id} value={method.id}>
                {method.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Stack>
    </SalesContractSection>
  );
}
