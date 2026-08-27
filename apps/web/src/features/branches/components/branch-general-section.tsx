"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import { FormField } from "@/ui";
import {
  FormSection,
  formFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import { SelectField } from "@/components/ui/form";
import { formatCnpj, formatCpf, formatPhone } from "@/lib/br-format";
import {
  BRANCH_PERSON_TYPES,
  BRANCH_PERSON_TYPE_LABELS,
  BRANCH_TAX_REGIMES,
  BRANCH_TAX_REGIME_LABELS,
  documentLabel,
  type BranchFormValues,
  type BranchPersonType,
  type BranchTaxRegime,
  type UnitKind,
} from "@/features/branches/types/branch";

const PERSON_TYPE_OPTIONS = BRANCH_PERSON_TYPES.map((value) => ({
  value,
  label: BRANCH_PERSON_TYPE_LABELS[value],
}));

const TAX_REGIME_OPTIONS = BRANCH_TAX_REGIMES.map((value) => ({
  value,
  label: BRANCH_TAX_REGIME_LABELS[value],
}));

type BranchGeneralSectionProps = {
  values: BranchFormValues;
  isEditing: boolean;
  onChange: <Key extends keyof BranchFormValues>(
    key: Key,
    value: BranchFormValues[Key],
  ) => void;
  unitKind: UnitKind;
  /** Logotipo à direita do cadastro. */
  aside?: ReactNode;
};

export function BranchGeneralSection({
  values,
  isEditing,
  onChange,
  unitKind,
  aside,
}: BranchGeneralSectionProps) {
  const isLegalEntity = values.personType === "PJ";

  function handleDocumentChange(raw: string) {
    onChange("document", isLegalEntity ? formatCnpj(raw) : formatCpf(raw));
  }

  function handlePersonTypeChange(value: string) {
    const nextType = value as BranchPersonType;
    onChange("personType", nextType);
    // O documento troca de máscara junto com o tipo de pessoa.
    onChange(
      "document",
      nextType === "PJ" ? formatCnpj(values.document) : formatCpf(values.document),
    );
  }

  return (
    <FormSection
      title="Informações gerais"
      description={
        unitKind === "matrix"
          ? "Cadastro fiscal da empresa matriz"
          : "Cadastro fiscal da loja ou unidade operacional"
      }
    >
      <Box
        sx={
          aside
            ? {
                display: "grid",
                gap: 2.5,
                alignItems: "start",
                gridTemplateColumns: { lg: "minmax(0, 1fr) 240px" },
              }
            : undefined
        }
      >
      <Box sx={formFieldGridSx}>
        <Box sx={span(4)}>
          <FormField
            label="Código da unidade"
            value={values.code}
            onChange={(event) => onChange("code", event.target.value)}
            placeholder="001"
            // Identidade fiscal: código, documento e tipo de pessoa não mudam
            // depois de criados (a API rejeita a alteração).
            disabled={isEditing}
            helperText={
              isEditing
                ? "Não pode ser alterado"
                : "Identificador único na empresa"
            }
            required
          />
        </Box>
        <Box sx={span(8)}>
          <FormField
            label="Razão social"
            value={values.legalName}
            onChange={(event) => onChange("legalName", event.target.value)}
            placeholder="Digite a razão social"
            required
          />
        </Box>
        <Box sx={span(12)}>
          <FormField
            label="Nome fantasia"
            value={values.tradeName}
            onChange={(event) => onChange("tradeName", event.target.value)}
            placeholder="Digite o nome fantasia"
          />
        </Box>
        <Box sx={span(4)}>
          <SelectField
            id="branch-person-type"
            label="Tipo de pessoa"
            value={values.personType}
            onChange={handlePersonTypeChange}
            options={PERSON_TYPE_OPTIONS}
            disabled={isEditing}
            required
          />
        </Box>
        <Box sx={span(4)}>
          <FormField
            label={documentLabel(values.personType)}
            value={values.document}
            onChange={(event) => handleDocumentChange(event.target.value)}
            placeholder={isLegalEntity ? "00.000.000/0000-00" : "000.000.000-00"}
            disabled={isEditing}
            required
          />
        </Box>
        <Box sx={span(4)}>
          <SelectField
            id="branch-tax-regime"
            label="Regime tributário"
            value={values.taxRegime}
            onChange={(value) => onChange("taxRegime", value as BranchTaxRegime)}
            options={TAX_REGIME_OPTIONS}
          />
        </Box>
        <Box sx={span(6)}>
          <FormField
            label="Inscrição estadual"
            value={values.stateRegistration}
            onChange={(event) => onChange("stateRegistration", event.target.value)}
          />
        </Box>
        <Box sx={span(6)}>
          <FormField
            label="Inscrição municipal"
            value={values.municipalRegistration}
            onChange={(event) =>
              onChange("municipalRegistration", event.target.value)
            }
          />
        </Box>
        <Box sx={span(6)}>
          <FormField
            label="Telefone"
            value={values.phone}
            onChange={(event) => onChange("phone", formatPhone(event.target.value))}
            placeholder="(00) 0000-0000"
          />
        </Box>
        <Box sx={span(6)}>
          <FormField
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => onChange("email", event.target.value)}
            placeholder="unidade@empresa.com.br"
          />
        </Box>
      </Box>
      {aside}
      </Box>
    </FormSection>
  );
}
