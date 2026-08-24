"use client";

import { useMemo } from "react";
import Box from "@mui/material/Box";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Autocomplete, Checkbox, FormField } from "@citybox/mui";
import { formFieldGridSx, formFieldSpanSx as span, FormSection } from "@/components/ui/form";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";

type UserGeneralSectionProps = {
  form: UserFormApi;
  profileOptions: PermissionProfileOption[];
};

export function UserGeneralSection({ form, profileOptions }: UserGeneralSectionProps) {
  const { values, setField, isEditing } = form;

  const selectedProfile = useMemo(
    () => profileOptions.find((option) => option.id === values.profileId) ?? null,
    [profileOptions, values.profileId],
  );

  return (
    <FormSection
      title="Geral"
      description="Informações importantes para identificar o usuário e facilitar o contato, garantindo um atendimento mais ágil e personalizado."
    >
      <Box sx={formFieldGridSx}>
        <Box sx={span(6)}>
          <Autocomplete
            label="Selecionar perfil"
            options={profileOptions}
            value={selectedProfile}
            onChange={(_, option) => setField("profileId", option?.id ?? "")}
            getOptionLabel={(option) => option.name}
            isOptionEqualToValue={(a, b) => a.id === b.id}
            renderOption={(props, option) => (
              <li {...props} key={option.id}>
                <Stack spacing={0}>
                  <Typography variant="body2">{option.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {option.description}
                  </Typography>
                </Stack>
              </li>
            )}
          />
        </Box>
        <Box sx={span(6)}>
          <FormField
            label="Nome"
            value={values.name}
            onChange={(event) => setField("name", event.target.value)}
            slotProps={{ htmlInput: { maxLength: 60 } }}
            // Nome/e-mail não entram no PUT da API — só no create.
            disabled={isEditing}
            required
          />
        </Box>
        <Box sx={span(12)}>
          <FormField
            label="E-mail"
            type="email"
            value={values.email}
            onChange={(event) => setField("email", event.target.value)}
            slotProps={{ htmlInput: { maxLength: 120 } }}
            disabled={isEditing}
            helperText={
              isEditing
                ? "O e-mail não pode ser alterado depois do cadastro."
                : undefined
            }
            required
          />
        </Box>
        <Box sx={span(12)}>
          <FormControlLabel
            control={
              <Checkbox
                checked={values.isSeller}
                onChange={(event) => setField("isSeller", event.target.checked)}
              />
            }
            label="Usuário vendedor"
          />
        </Box>
      </Box>
    </FormSection>
  );
}
