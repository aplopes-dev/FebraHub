"use client";

import Link from "next/link";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { Autocomplete, DatePicker, FormField } from "@citybox/mui";

import {
  BRAND_COLOR_OPTIONS,
  CNAE_OPTIONS,
  SEGMENT_OPTIONS,
  type CompanyOption,
} from "../lib/company-options";
import { formatCpf, formatPhone } from "@/lib/br-format";
import type { CompanySettingsFormApi } from "../hooks/use-company-settings-form";
import { CompanyAddressFields } from "./company-address-fields";
import { CompanyLogoField } from "./company-logo-field";
import { SelectField } from "@/components/ui/form";
import {
  FormSection as CompanySettingsSection,
  formFieldGridSx as companyFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";

const SOON = "Em breve";

type CompanyRegistrationTabProps = {
  form: CompanySettingsFormApi;
};

function parseDate(value: string): Date | undefined {
  if (!value) return undefined;
  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed;
}

function toIsoDate(date: Date | undefined): string {
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

export function CompanyRegistrationTab({ form }: CompanyRegistrationTabProps) {
  const { values, setField, setAddressField, setContactField } = form;

  const selectedCnae =
    CNAE_OPTIONS.find((option) => option.value === values.cnae) ?? null;

  const documentLabel = values.personType === "PF" ? "CPF" : "CNPJ";

  return (
    <Stack spacing={5}>
      <CompanySettingsSection
        title="Informações gerais"
        description="Preencha os dados principais da empresa"
      >
        <Box
          sx={{
            display: "grid",
            gap: 2.5,
            alignItems: "start",
            gridTemplateColumns: { lg: "minmax(0, 1fr) 240px" },
          }}
        >
          <Box sx={companyFieldGridSx}>
            <Box sx={span(5)}>
              <FormField
                label="Código da empresa"
                value={values.companyCode}
                disabled
                helperText="Identificador interno (somente leitura)"
              />
            </Box>
            <Box sx={span(7)}>
              <FormField
                label="Razão social"
                value={values.legalName}
                onChange={(event) => setField("legalName", event.target.value)}
                placeholder="Digite a razão social"
                required
              />
            </Box>
            <Box sx={span(12)}>
              <FormField
                label="Nome fantasia"
                value={values.tradeName}
                onChange={(event) => setField("tradeName", event.target.value)}
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label={documentLabel}
                value={values.cnpj}
                disabled
                helperText="Documento e tipo de pessoa não são editáveis"
                required
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="company-segment"
                label="Segmento"
                value={values.segment}
                onChange={(value) => setField("segment", value)}
                options={SEGMENT_OPTIONS}
                placeholder="Selecione o segmento"
                disabled
                helperText={SOON}
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="E-mail comercial"
                type="email"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="contato@empresa.com.br"
                required
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="Telefone comercial"
                value={values.phone}
                onChange={(event) => setField("phone", formatPhone(event.target.value))}
                placeholder="(00) 0000-0000"
              />
            </Box>
            <Box sx={span(6)}>
              <DatePicker
                label="Data de fundação"
                value={parseDate(values.foundationDate)}
                onChange={(date) => setField("foundationDate", toIsoDate(date))}
                disabled
              />
              <Box sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}>
                {SOON}
              </Box>
            </Box>
          </Box>

          <CompanyLogoField
            logoUrl={values.logoUrl}
            onChange={(logoUrl) => setField("logoUrl", logoUrl)}
            disabled
          />
        </Box>

        <Autocomplete<CompanyOption>
          label="CNAE principal"
          placeholder="Busque e selecione o CNAE"
          options={CNAE_OPTIONS}
          value={selectedCnae}
          onChange={(_, option) => setField("cnae", option?.value ?? "")}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(option, selected) => option.value === selected.value}
          disabled
        />
        <Box sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 0.5 }}>
          {SOON}
        </Box>
      </CompanySettingsSection>

      <CompanySettingsSection
        title="Endereço da empresa"
        description="Informe o endereço da sede da empresa"
      >
        <Alert severity="info" sx={{ mb: 2 }}>
          Este endereço ainda não é usado em nenhum lugar do sistema. O endereço
          usado na emissão fiscal (certificado digital, NF-e/NFS-e) vem do
          cadastro da <strong>filial matriz</strong>, em{" "}
          <MuiLink component={Link} href="/configuracoes/unidades-filiais">
            Configurações › Unidades e filiais
          </MuiLink>
          .
        </Alert>
        <CompanyAddressFields
          idPrefix="company-address"
          address={values.address}
          onChange={setAddressField}
          disabled
        />
        <Box sx={{ fontSize: "0.75rem", color: "text.secondary", mt: 1 }}>
          {SOON} — endereço da sede ainda não é persistido pela API.
        </Box>
      </CompanySettingsSection>

      <CompanySettingsSection
        title="Contato financeiro"
        description="Ainda não há cadastro separado na API — em breve"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <FormField
              label="Nome"
              value={values.financeContact.name}
              disabled
              helperText={SOON}
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="E-mail"
              type="email"
              value={values.financeContact.email}
              disabled
              helperText={SOON}
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="Telefone"
              value={values.financeContact.phone}
              disabled
              helperText={SOON}
            />
          </Box>
        </Box>
      </CompanySettingsSection>

      <CompanySettingsSection
        title="Contato proprietário"
        description="Responsável legal pela empresa (salvo na API)"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <FormField
              label="Nome"
              value={values.ownerContact.name}
              onChange={(event) =>
                setContactField("ownerContact", "name", event.target.value)
              }
              placeholder="Digite o nome do proprietário"
              required
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="CPF"
              value={values.ownerContact.document ?? ""}
              onChange={(event) =>
                setContactField(
                  "ownerContact",
                  "document",
                  formatCpf(event.target.value),
                )
              }
              placeholder="000.000.000-00"
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="E-mail"
              type="email"
              value={values.ownerContact.email}
              onChange={(event) =>
                setContactField("ownerContact", "email", event.target.value)
              }
              placeholder="Digite o e-mail"
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="Telefone"
              value={values.ownerContact.phone}
              onChange={(event) =>
                setContactField("ownerContact", "phone", formatPhone(event.target.value))
              }
              placeholder="(00) 0000-0000"
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="Celular"
              value={values.ownerContact.mobile ?? ""}
              disabled
              helperText={SOON}
              placeholder="(00) 90000-0000"
            />
          </Box>
        </Box>
      </CompanySettingsSection>

      <CompanySettingsSection
        title="Identidade visual"
        description="A cor de marca é aplicada no tema do sistema e no ícone da aba do navegador (salva neste navegador)"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <SelectField
              id="company-brand-color"
              label="Cor da marca"
              value={values.brandColor ?? BRAND_COLOR_OPTIONS[0].value}
              onChange={(value) => setField("brandColor", value)}
              options={BRAND_COLOR_OPTIONS}
              withColorSwatch
            />
          </Box>
          <Box
            sx={{
              ...span(6),
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <Box
              aria-hidden
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                border: 1,
                borderColor: "divider",
                bgcolor: values.brandColor ?? BRAND_COLOR_OPTIONS[0].value,
              }}
            />
            <Box sx={{ fontSize: "0.875rem", color: "text.secondary" }}>
              Pré-visualização da cor selecionada
            </Box>
          </Box>
        </Box>
      </CompanySettingsSection>
    </Stack>
  );
}
