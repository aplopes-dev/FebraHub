"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Button, Checkbox, FormField, Radio, RadioGroup } from "@citybox/mui";

import { MOCK_PLAN_INFO } from "../data/mock-company";
import { formatCnpj, formatCpf } from "@/lib/br-format";
import type { BillingPersonType } from "../types/company";
import type { CompanySettingsFormApi } from "../hooks/use-company-settings-form";
import { CompanyAddressFields } from "./company-address-fields";
import { CompanySoonAlert } from "./company-soon-alert";
import { PlanDetailsModal } from "./plan-details-modal";
import {
  FormSection as CompanySettingsSection,
  formFieldGridSx as companyFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";

type CompanyBillingTabProps = {
  form: CompanySettingsFormApi;
};

export function CompanyBillingTab({ form }: CompanyBillingTabProps) {
  const { values, setBillingField, setBillingAddressField } = form;
  const [planModalOpen, setPlanModalOpen] = useState(false);

  const billing = values.billing;
  const isLegalEntity = billing.personType === "juridica";
  // Cobrança ainda não tem endpoint — tudo bloqueado (não finge salvar).
  const fieldsDisabled = true;

  return (
    <>
      <Stack spacing={5}>
        <CompanySoonAlert>
          Os dados de cobrança e o plano ainda não são salvos na API. O botão
          Salvar do rodapé atualiza apenas o cadastro da empresa (aba Cadastro)
          e a cor de marca.
        </CompanySoonAlert>

        <CompanySettingsSection
          title="Informações da fatura"
          description="Informe os dados do pagador para emitir a nota fiscal referente ao serviço contratado na assinatura do sistema"
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={billing.overrideEnabled}
                disabled
                onChange={(event) =>
                  setBillingField("overrideEnabled", event.target.checked)
                }
              />
            }
            label="Alterar dados do faturamento (em breve)"
          />

          <Stack spacing={1}>
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              Tipo de pessoa
            </Typography>
            <RadioGroup
              row
              value={billing.personType}
              onChange={(event) => {
                const nextType = event.target.value as BillingPersonType;
                setBillingField("personType", nextType);
                // O documento troca de máscara junto com o tipo de pessoa.
                setBillingField(
                  "document",
                  nextType === "juridica"
                    ? formatCnpj(billing.document)
                    : formatCpf(billing.document),
                );
              }}
            >
              <FormControlLabel
                value="juridica"
                control={<Radio disabled={fieldsDisabled} />}
                label="Pessoa jurídica"
              />
              <FormControlLabel
                value="fisica"
                control={<Radio disabled={fieldsDisabled} />}
                label="Pessoa física"
              />
            </RadioGroup>
          </Stack>

          <Box sx={companyFieldGridSx}>
            <Box sx={span(6)}>
              <FormField
                label={isLegalEntity ? "Razão social" : "Nome completo"}
                value={billing.legalName}
                onChange={(event) => setBillingField("legalName", event.target.value)}
                disabled={fieldsDisabled}
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label={isLegalEntity ? "CNPJ" : "CPF"}
                value={billing.document}
                onChange={(event) =>
                  setBillingField(
                    "document",
                    isLegalEntity
                      ? formatCnpj(event.target.value)
                      : formatCpf(event.target.value),
                  )
                }
                placeholder={isLegalEntity ? "00.000.000/0000-00" : "000.000.000-00"}
                disabled={fieldsDisabled}
              />
            </Box>
          </Box>
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Endereço de cobrança"
          description="Informe o endereço de cobrança que será registrado na fatura"
        >
          <FormControlLabel
            control={
              <Checkbox
                checked={billing.useCustomAddress}
                disabled
                onChange={(event) =>
                  setBillingField("useCustomAddress", event.target.checked)
                }
              />
            }
            label="Adicionar outro endereço (em breve)"
          />

          <CompanyAddressFields
            idPrefix="billing-address"
            address={billing.useCustomAddress ? billing.address : values.address}
            onChange={setBillingAddressField}
            disabled
          />
        </CompanySettingsSection>

        <CompanySettingsSection
          title="Plano e assinatura"
          description="Acompanhe o plano contratado e os limites de uso da assinatura"
        >
          <Box
            sx={{
              p: 2,
              borderRadius: 1,
              bgcolor: "action.hover",
              border: 1,
              borderColor: "divider",
            }}
          >
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center", gap: 2 }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {MOCK_PLAN_INFO.name}
              </Typography>
              <Box
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 10,
                  bgcolor: "success.light",
                  color: "success.dark",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  textTransform: "uppercase",
                }}
              >
                Ativo
              </Box>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
              Renova em: {new Date(MOCK_PLAN_INFO.expiresAt).toLocaleDateString("pt-BR")}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            onClick={() => setPlanModalOpen(true)}
            sx={{ alignSelf: "flex-start" }}
          >
            Detalhes do plano
          </Button>
        </CompanySettingsSection>
      </Stack>

      {planModalOpen ? (
        <PlanDetailsModal
          open={planModalOpen}
          onClose={() => setPlanModalOpen(false)}
          plan={MOCK_PLAN_INFO}
        />
      ) : null}
    </>
  );
}
