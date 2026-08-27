"use client";

import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import { Checkbox, PasswordInput } from "@/ui";
import { formFieldGridSx, formFieldSpanSx as span, FormSection } from "@/components/ui/form";
import { USER_GENERAL_SETTINGS_CHECKBOXES } from "@/features/users-permissions/lib/user-format";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";

type UserSettingsSectionProps = {
  form: UserFormApi;
};

export function UserSettingsSection({ form }: UserSettingsSectionProps) {
  const { values, setSetting } = form;

  return (
    <FormSection
      title="Configurações gerais"
      description="Ajuste permissões adicionais, preferências de e-mails e senhas específicas para o uso do sistema."
    >
      <Stack spacing={0.5}>
        {USER_GENERAL_SETTINGS_CHECKBOXES.map((item) => (
          <FormControlLabel
            key={item.key}
            control={
              <Checkbox
                checked={values.settings[item.key]}
                onChange={(event) => setSetting(item.key, event.target.checked)}
              />
            }
            label={item.label}
          />
        ))}
      </Stack>

      <Box sx={formFieldGridSx}>
        <Box sx={span(6)}>
          <PasswordInput
            label="Senha utilizada no atendimento de mesas"
            value={values.settings.tableServicePassword}
            onChange={(event) => setSetting("tableServicePassword", event.target.value)}
          />
        </Box>
        <Box sx={span(6)}>
          <PasswordInput
            label="PIN utilizado para dar acesso ao suporte"
            value={values.settings.supportPin}
            onChange={(event) => setSetting("supportPin", event.target.value)}
          />
        </Box>
      </Box>
    </FormSection>
  );
}
