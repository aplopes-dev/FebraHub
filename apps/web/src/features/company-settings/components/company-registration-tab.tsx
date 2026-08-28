"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField } from "@/ui";
import { AddressSection } from "./address-section";
import { CompanyLogoField } from "./company-logo-field";
import { formatCnpj, formatPhone } from "@/lib/br-format";
import { SelectField } from "@/components/ui/form";
import {
  FormSection as CompanySettingsSection,
  formFieldGridSx as companyFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import type { CompanySettingsFormApi } from "../hooks/use-company-settings-form";

const TIMEZONE_OPTIONS = [
  { value: "America/Bahia", label: "America/Bahia (Brasília, UTC−3)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasília, UTC−3)" },
  { value: "America/Fortaleza", label: "America/Fortaleza (UTC−3)" },
  { value: "America/Manaus", label: "America/Manaus (UTC−4)" },
  { value: "America/Cuiaba", label: "America/Cuiaba (UTC−4)" },
  { value: "America/Rio_Branco", label: "America/Rio_Branco (UTC−5)" },
  { value: "America/Noronha", label: "America/Noronha (UTC−2)" },
];

type CompanyRegistrationTabProps = {
  form: CompanySettingsFormApi;
};

function formatCreatedAt(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

export function CompanyRegistrationTab({ form }: CompanyRegistrationTabProps) {
  const {
    values,
    meta,
    setField,
    setAddressField,
    patchAddress,
    logoPreviewUrl,
    setLogoFile,
    removeLogo,
  } = form;

  return (
    <Stack spacing={5}>
      <CompanySettingsSection
        title="Identificação"
        description="Como a unidade aparece no sistema e nos documentos"
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
            <Box sx={span(6)}>
              <FormField
                label="Razão social"
                value={values.legalName}
                onChange={(event) => setField("legalName", event.target.value)}
                placeholder="Como consta no CNPJ"
                required
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="Nome fantasia"
                value={values.tradeName}
                onChange={(event) => setField("tradeName", event.target.value)}
                placeholder="O nome usado no dia a dia"
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="CNPJ"
                value={values.holdingDocument}
                onChange={(event) =>
                  setField("holdingDocument", formatCnpj(event.target.value))
                }
                placeholder="00.000.000/0000-00"
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="group-timezone"
                label="Fuso horário"
                value={values.timezone}
                onChange={(value) => setField("timezone", value)}
                options={TIMEZONE_OPTIONS}
              />
            </Box>
          </Box>
          <CompanyLogoField
            previewUrl={logoPreviewUrl}
            onSelect={setLogoFile}
            onRemove={removeLogo}
          />
        </Box>
      </CompanySettingsSection>

      <CompanySettingsSection
        title="Contato"
        description="Canais gerais da unidade"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <FormField
              label="E-mail de contato"
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="contato@empresa.com"
              required
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="Telefone"
              value={values.phone}
              onChange={(event) =>
                setField("phone", formatPhone(event.target.value))
              }
              placeholder="(00) 0000-0000"
            />
          </Box>
        </Box>
      </CompanySettingsSection>

      <AddressSection
        address={values.adminAddress}
        onChange={setAddressField}
        onPatch={patchAddress}
        resetToken="group-admin"
        title="Endereço"
        description="Onde a unidade funciona"
      />

      <CompanySettingsSection
        title="Registro"
        description="Somente leitura"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <Typography variant="body2" color="text.secondary">
              Cadastro criado em
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {formatCreatedAt(meta.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CompanySettingsSection>
    </Stack>
  );
}
