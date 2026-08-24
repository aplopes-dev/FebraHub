"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { Switch } from "@citybox/mui";
import {
  FormSection,
  formFieldGridSx,
  formFieldSpanSx as span,
} from "@/components/ui/form";
import { SelectField } from "@/components/ui/form";
import type { BranchFormValues } from "@/features/branches/types/branch";

/** Fusos usados pelas operações no Brasil. */
const TIMEZONE_OPTIONS = [
  { value: "America/Bahia", label: "America/Bahia (Brasília, UTC−3)" },
  { value: "America/Sao_Paulo", label: "America/Sao_Paulo (Brasília, UTC−3)" },
  { value: "America/Fortaleza", label: "America/Fortaleza (UTC−3)" },
  { value: "America/Manaus", label: "America/Manaus (UTC−4)" },
  { value: "America/Cuiaba", label: "America/Cuiaba (UTC−4)" },
  { value: "America/Rio_Branco", label: "America/Rio_Branco (UTC−5)" },
  { value: "America/Noronha", label: "America/Noronha (UTC−2)" },
];

type BranchUsageSectionProps = {
  values: BranchFormValues;
  onChange: <Key extends keyof BranchFormValues>(
    key: Key,
    value: BranchFormValues[Key],
  ) => void;
};

export function BranchUsageSection({ values, onChange }: BranchUsageSectionProps) {
  return (
    <FormSection
      title="Definições de uso"
      description="Fuso horário e situação da unidade nas operações do dia a dia"
    >
      <Box sx={formFieldGridSx}>
        <Box sx={span(6)}>
          <SelectField
            id="branch-timezone"
            label="Fuso horário"
            value={values.timezone}
            onChange={(value) => onChange("timezone", value)}
            options={TIMEZONE_OPTIONS}
            helperText="Base para fechamento de caixa e relatórios"
          />
        </Box>
        <Box sx={span(12)}>
          <FormControlLabel
            control={
              <Switch
                checked={values.active}
                onChange={(event) => onChange("active", event.target.checked)}
              />
            }
            label="Unidade ativa"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            Unidades inativas não aparecem no seletor de unidade nem recebem novas
            operações.
          </Typography>
        </Box>
      </Box>
    </FormSection>
  );
}
