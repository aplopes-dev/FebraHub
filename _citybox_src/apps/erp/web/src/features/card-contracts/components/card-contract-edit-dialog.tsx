"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Button,
  Checkbox,
  CurrencyInput,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  FormField,
  NumberSpinner,
  Radio,
  RadioGroup,
} from "@citybox/mui";
import { CardContractSection } from "@/features/card-contracts/components/card-contract-section";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { cardContractToFormValues } from "@/features/card-contracts/api/card-contract.mapper";
import {
  CUTOFF_PERIOD_LABELS,
  FIRST_PAYMENT_DAY_LABELS,
  GROUPING_LABELS,
  GROUPING_DESCRIPTIONS,
  INSTALLMENT_DAY_LABELS,
  type CardContract,
  type CardContractFormValues,
  type CardContractGrouping,
} from "@/features/card-contracts/types/card-contract";

type CardContractEditDialogProps = {
  open: boolean;
  onClose: () => void;
  onSave: (values: CardContractFormValues) => void;
  contract: CardContract;
  formKey: string;
  isSaving?: boolean;
};

export function CardContractEditDialog({
  open,
  onClose,
  onSave,
  contract,
  formKey,
  isSaving = false,
}: CardContractEditDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => {
        if (!isSaving) onClose();
      }}
      maxWidth="md"
      fullWidth
    >
      <CardContractEditDialogBody
        key={formKey}
        onClose={onClose}
        onSave={onSave}
        contract={contract}
        isSaving={isSaving}
      />
    </Dialog>
  );
}

function CardContractEditDialogBody({
  onClose,
  onSave,
  contract,
  isSaving,
}: {
  onClose: () => void;
  onSave: (values: CardContractFormValues) => void;
  contract: CardContract;
  isSaving: boolean;
}) {
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccounts = bankAccountsQuery.data ?? [];
  const [values, setValues] = useState<CardContractFormValues>(() =>
    cardContractToFormValues(contract),
  );

  function setField<K extends keyof CardContractFormValues>(
    key: K,
    value: CardContractFormValues[K],
  ) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <>
      <DialogTitle>Editar contrato</DialogTitle>
      <DialogContent>
        <Stack spacing={4} sx={{ mt: 1 }}>
          <CardContractSection
            title="Dados do contrato"
            description="Informações básicas do contrato com a adquirente."
          >
            <FormField
              label="Provedor"
              placeholder="Nome do provedor"
              value={values.provider}
              onChange={(event) =>
                setField("provider", event.target.value)
              }
            />

            <Autocomplete
              label="Conta para crédito"
              options={bankAccounts}
              value={
                bankAccounts.find(
                  (account) => account.id === values.bankAccountId,
                ) ?? null
              }
              onChange={(_, value) =>
                setField("bankAccountId", value?.id ?? "")
              }
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  {option.name}
                </li>
              )}
              noOptionsText="Nenhuma conta bancária cadastrada."
            />

            <FormField
              label="Descrição"
              placeholder="Descrição opcional do contrato"
              value={values.description}
              onChange={(event) =>
                setField("description", event.target.value)
              }
              multiline
              minRows={2}
            />

            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
              >
                Agrupar
              </FormLabel>
              <RadioGroup
                value={values.grouping}
                onChange={(event) =>
                  setField(
                    "grouping",
                    event.target.value as CardContractGrouping,
                  )
                }
              >
                {(
                  [
                    "by_payment_method",
                    "by_card_brand",
                    "no_grouping",
                  ] as CardContractGrouping[]
                ).map((key) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio size="small" />}
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {GROUPING_LABELS[key]}
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: "text.secondary", display: "block" }}
                        >
                          {GROUPING_DESCRIPTIONS[key]}
                        </Typography>
                      </Box>
                    }
                    sx={{ alignItems: "flex-start", mx: 0, mb: 0.5 }}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
              >
                Período de corte
              </FormLabel>
              <RadioGroup
                value={values.cutoffPeriod}
                onChange={(event) =>
                  setField(
                    "cutoffPeriod",
                    event.target.value as "daily" | "weekly" | "monthly",
                  )
                }
                row
              >
                {(
                  ["daily", "weekly", "monthly"] as (
                    | "daily"
                    | "weekly"
                    | "monthly"
                  )[]
                ).map((key) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio size="small" />}
                    label={CUTOFF_PERIOD_LABELS[key]}
                  />
                ))}
              </RadioGroup>
            </FormControl>
          </CardContractSection>

          <CardContractSection
            title="Prazos de pagamento"
            description="Regras de pagamento e parcelamento do contrato."
          >
            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
              >
                Dia do primeiro pagamento
              </FormLabel>
              <RadioGroup
                value={values.firstPaymentDayType}
                onChange={(event) =>
                  setField(
                    "firstPaymentDayType",
                    event.target.value as "business_days" | "calendar_days",
                  )
                }
                row
              >
                {(
                  ["business_days", "calendar_days"] as (
                    | "business_days"
                    | "calendar_days"
                  )[]
                ).map((key) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio size="small" />}
                    label={FIRST_PAYMENT_DAY_LABELS[key]}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel
                component="legend"
                sx={{ fontWeight: 500, fontSize: "0.875rem", mb: 1 }}
              >
                Dia das parcelas
              </FormLabel>
              <RadioGroup
                value={values.installmentDayType}
                onChange={(event) =>
                  setField(
                    "installmentDayType",
                    event.target.value as
                      | "business_days"
                      | "calendar_days"
                      | "single_payment",
                  )
                }
                row
              >
                {(
                  ["business_days", "calendar_days", "single_payment"] as (
                    | "business_days"
                    | "calendar_days"
                    | "single_payment"
                  )[]
                ).map((key) => (
                  <FormControlLabel
                    key={key}
                    value={key}
                    control={<Radio size="small" />}
                    label={INSTALLMENT_DAY_LABELS[key]}
                  />
                ))}
              </RadioGroup>
            </FormControl>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={values.businessDaysOnly}
                  onChange={(event) =>
                    setField("businessDaysOnly", event.target.checked)
                  }
                />
              }
              label="Habilitar vencimento apenas em dias úteis"
            />
          </CardContractSection>

          <CardContractSection
            title="Taxas e antecipações"
            description="Tarifas e regras de antecipação de recebíveis."
          >
            <CurrencyInput
              label="Tarifa para depósito"
              placeholder="R$ 0,00"
              value={values.depositFee}
              onValueChange={(value) => setField("depositFee", value)}
            />

            <Stack direction="row" spacing={2}>
              <Box sx={{ flex: 1 }}>
                <NumberSpinner
                  id="card-contract-anticipation-rate"
                  label="Taxa de antecipação (%)"
                  value={values.anticipationRate}
                  min={0}
                  max={100}
                  step={0.1}
                  onValueChange={(value) =>
                    setField("anticipationRate", value ?? 0)
                  }
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <NumberSpinner
                  id="card-contract-anticipation-periods"
                  label="Períodos de antecipação (dias)"
                  value={values.anticipationPeriods}
                  min={0}
                  step={1}
                  onValueChange={(value) =>
                    setField("anticipationPeriods", value ?? 0)
                  }
                />
              </Box>
            </Stack>

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={values.allEntriesPaidInContract}
                  onChange={(event) =>
                    setField(
                      "allEntriesPaidInContract",
                      event.target.checked,
                    )
                  }
                />
              }
              label="Definir todas as entradas como pagas neste contrato"
            />

            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={values.businessDaysDeposit}
                  onChange={(event) =>
                    setField("businessDaysDeposit", event.target.checked)
                  }
                />
              }
              label="Pagamentos são depositados apenas em dias úteis"
            />
          </CardContractSection>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button
          type="button"
          variant="outlined"
          onClick={onClose}
          disabled={isSaving}
        >
          Cancelar
        </Button>
        <Button
          type="button"
          variant="contained"
          onClick={() => onSave(values)}
          loading={isSaving}
          disabled={isSaving || !values.provider.trim()}
        >
          Salvar alterações
        </Button>
      </DialogActions>
    </>
  );
}
