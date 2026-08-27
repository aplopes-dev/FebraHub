"use client";

import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FormField } from "@/ui";
import { BranchAddressSection } from "@/features/branches/components/branch-address-section";
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
        description="Dados do grupo (holding ou marca interna de uso)"
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
                label="Nome do grupo"
                value={values.legalName}
                onChange={(event) => setField("legalName", event.target.value)}
                placeholder="Razão social da holding ou nome interno"
                required
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="Nome fantasia / marca comercial"
                value={values.tradeName}
                onChange={(event) => setField("tradeName", event.target.value)}
                placeholder="O que aparece no sistema e em relatórios"
              />
            </Box>
            <Box sx={span(6)}>
              <FormField
                label="CNPJ da holding"
                value={values.holdingDocument}
                onChange={(event) =>
                  setField("holdingDocument", formatCnpj(event.target.value))
                }
                placeholder="00.000.000/0000-00"
                helperText="Opcional. Não é usado em processo de documentação."
              />
            </Box>
            <Box sx={span(6)}>
              <SelectField
                id="group-timezone"
                label="Fuso horário padrão"
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
        title="Contato institucional"
        description="Canal geral do grupo — não confundir com o estabelecimento da filial"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <FormField
              label="E-mail de contato geral"
              type="email"
              value={values.email}
              onChange={(event) => setField("email", event.target.value)}
              placeholder="contato@empresa.com"
              required
            />
          </Box>
          <Box sx={span(6)}>
            <FormField
              label="Telefone principal"
              value={values.phone}
              onChange={(event) =>
                setField("phone", formatPhone(event.target.value))
              }
              placeholder="(00) 0000-0000"
            />
          </Box>
        </Box>
      </CompanySettingsSection>

      <BranchAddressSection
        address={values.adminAddress}
        onChange={setAddressField}
        onPatch={patchAddress}
        resetToken="group-admin"
        title="Endereço administrativo / sede"
        description="Onde fica a diretoria — não é o endereço fiscal do estabelecimento (esse pertence à filial)"
      />

      <CompanySettingsSection
        title="Metadados"
        description="Informações somente leitura"
      >
        <Box sx={companyFieldGridSx}>
          <Box sx={span(6)}>
            <Typography variant="body2" color="text.secondary">
              Data de criação
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              {formatCreatedAt(meta.createdAt)}
            </Typography>
          </Box>
          <Box sx={span(6)}>
            <Typography variant="body2" color="text.secondary">
              Matrizes e filiais
            </Typography>
            <Typography variant="body1" sx={{ mt: 0.5 }}>
              <MuiLink component={Link} href="/settings/units">
                {meta.unitsCount}{" "}
                {meta.unitsCount === 1 ? "unidade" : "unidades"} — ver Matrizes e
                Filiais
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </CompanySettingsSection>
    </Stack>
  );
}
