"use client";

import { useRouter } from "next/navigation";
import { Page } from "@/components/ui/page";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Typography from "@mui/material/Typography";
import {
  Autocomplete,
  Checkbox,
  CurrencyInput,
  FormControlLabel,
  FormField,
  NumberSpinner,
  Radio,
  RadioGroup,
  } from "@/ui";
import { EntityFormFooter } from "@/components/ui/form";
import { EntityFormHeader } from "@/components/ui/form";
import { CardContractSection } from "@/features/card-contracts/components/card-contract-section";
import { CARD_PROVIDER_SUGGESTIONS } from "@/features/card-contracts/data/card-providers";
import { useBankAccountOptionsQuery } from "@/features/bank-accounts/hooks/use-bank-account-options-query";
import { useCardContractForm } from "@/features/card-contracts/hooks/use-card-contract-form";
import {
  CUTOFF_PERIOD_LABELS,
  FIRST_PAYMENT_DAY_LABELS,
  GROUPING_DESCRIPTIONS,
  GROUPING_LABELS,
  INSTALLMENT_DAY_LABELS,
  type CardContractGrouping,
} from "@/features/card-contracts/types/card-contract";

export function CardContractFormView() {
  const router = useRouter();
  const bankAccountsQuery = useBankAccountOptionsQuery();
  const bankAccounts = bankAccountsQuery.data ?? [];
  const { values, setField, isDirty, hasSavedOnce, isSaving, discard, save } =
    useCardContractForm({
      onSaved: () => {
        router.push("/financas/contratos-de-cartoes-e-outros");
      },
    });

  function handleSave() {
    save();
  }

  function handleDiscard() {
    discard();
    router.push("/financas/contratos-de-cartoes-e-outros");
  }

  return (
    <Page
      footer={
        <EntityFormFooter
          mode="dirty"
          isDirty={isDirty}
          hasSavedOnce={hasSavedOnce}
          isSaving={isSaving}
          saveLabel="Salvar contrato"
          onCancel={handleDiscard}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      }
    >
      <Stack
        spacing={5}
        sx={{ minWidth: 0, maxWidth: "100%" }}
      >
        <EntityFormHeader
          title="Novo contrato"
          subtitle="Contratos de cartões"
          backHref="/financas/contratos-de-cartoes-e-outros"
        />

        <CardContractSection
          title="Dados do contrato"
          description="Configure as informações básicas do contrato com a adquirente. A partir do fechamento de uma venda no cartão/Pix, o Financeiro passa a usar estes dados para calcular o valor líquido e a data de recebimento automaticamente."
        >
          <Autocomplete
            label="Provedor"
            placeholder="Selecione o provedor"
            options={CARD_PROVIDER_SUGGESTIONS}
            value={values.provider || undefined}
            onChange={(_, value) => setField("provider", value ?? "")}
            disableClearable
            noOptionsText="Nenhum provedor encontrado."
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
            <Typography
              variant="caption"
              sx={{ color: "text.secondary", display: "block", mb: 1 }}
            >
              Cadastrável, mas ainda sem efeito no cálculo dos recebíveis
              nesta versão — fica registrado para uma entrega futura.
            </Typography>
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

        <Divider />

        <CardContractSection
          title="Prazos de pagamento"
          description="Defina as regras de pagamento e parcelamento do contrato — é a partir daqui que o Financeiro calcula em que data cada recebível vence."
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

        <Divider />

        <CardContractSection
          title="Taxas e antecipações"
          description="A taxa e a tarifa de cada método de pagamento (Pix/débito/crédito) ficam no cadastro de Métodos de pagamento, na tela de detalhe do contrato — são elas que o Financeiro desconta de cada venda. Os campos abaixo ainda não têm efeito no cálculo dos recebíveis nesta versão."
        >
          <CurrencyInput
            label="Tarifa para depósito"
            placeholder="R$ 0,00"
            value={values.depositFee}
            onValueChange={(value) => setField("depositFee", value)}
            helperText="Cadastrável, mas ainda sem efeito no cálculo dos recebíveis."
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
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: -1 }}
          >
            Cadastrável, mas ainda sem efeito no cálculo dos recebíveis.
          </Typography>

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
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", display: "block", mt: -1 }}
          >
            Cadastrável, mas ainda sem efeito — quem controla o dia útil do
            vencimento hoje é &ldquo;Habilitar vencimento apenas em dias
            úteis&rdquo;, em Prazos de pagamento.
          </Typography>
        </CardContractSection>
      </Stack>
    </Page>
  );
}
