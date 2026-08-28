"use client";

import { useEffect, useMemo } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Autocomplete, FormField } from "@/ui";
import {
  formFieldGridSx,
  formFieldSpanSx as span,
  FormSection,
} from "@/components/ui/form";
import {
  defaultProfileKeyForRole,
  FUNCTIONAL_ROLE_OPTIONS,
} from "@/features/users-permissions/lib/functional-roles";
import type { UserFormApi } from "@/features/users-permissions/hooks/use-user-form";
import type { PermissionProfileOption } from "@/features/users-permissions/types/permission-profile";
import type { FunctionalRole } from "@/features/users-permissions/types/user";

type UserGeneralFieldsProps = {
  form: UserFormApi;
  profileOptions: PermissionProfileOption[];
  /**
   * Campos por linha. `2` (padrão) é a página, larga; `1` empilha, para o
   * drawer — onde não há largura para dois.
   */
  columns?: 1 | 2;
};

type UserGeneralSectionProps = Omit<UserGeneralFieldsProps, "columns">;

function resolveProfileForRole(
  role: FunctionalRole,
  options: PermissionProfileOption[],
): PermissionProfileOption | null {
  const key = defaultProfileKeyForRole(role);
  return (
    options.find((option) => option.systemKey === key || option.id === key) ??
    options[0] ??
    null
  );
}

/**
 * Só os campos, sem a moldura de seção.
 *
 * Existe porque o `FormSection` desenha um card com borda e fundo próprios —
 * dentro de um drawer isso vira caixa dentro de caixa e o painel passa a ler
 * como um modal. Em página, use o `UserGeneralSection` logo abaixo.
 */
export function UserGeneralFields({
  form,
  profileOptions,
  columns = 2,
}: UserGeneralFieldsProps) {
  const { values, setField, isEditing } = form;
  const stacked = columns === 1;
  const fieldSpan = span(stacked ? 12 : 6);

  const selectedRole = useMemo(
    () =>
      FUNCTIONAL_ROLE_OPTIONS.find(
        (option) => option.value === values.functionalRole,
      ) ?? null,
    [values.functionalRole],
  );

  const selectedProfile = useMemo(
    () =>
      profileOptions.find((option) => option.id === values.profileId) ?? null,
    [profileOptions, values.profileId],
  );

  useEffect(() => {
    if (isEditing || values.profileId) return;
    const suggested = resolveProfileForRole(
      values.functionalRole,
      profileOptions,
    );
    if (suggested) {
      setField("profileId", suggested.id);
    }
  }, [
    isEditing,
    values.functionalRole,
    values.profileId,
    profileOptions,
    setField,
  ]);

  return (
    <Box
      sx={[
        formFieldGridSx,
        // Empilhado não há coluna vizinha separando um campo do outro, então o
        // respiro vertical do grid de página (16px) fica curto. O `gap` mora no
        // `formFieldGridSx`, que é de todas as telas — o ajuste é só aqui.
        stacked && { gap: 3 },
      ]}
    >
      <Box sx={fieldSpan}>
        <FormField
          label="Nome"
          value={values.name}
          onChange={(event) => setField("name", event.target.value)}
          slotProps={{ htmlInput: { maxLength: 60 } }}
          disabled={isEditing}
          required
        />
      </Box>
      <Box sx={fieldSpan}>
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
      <Box sx={fieldSpan}>
        <Autocomplete
          label="Papel funcional"
          options={FUNCTIONAL_ROLE_OPTIONS}
          value={selectedRole}
          onChange={(_, option) => {
            if (!option) return;
            setField("functionalRole", option.value);
            const suggested = resolveProfileForRole(
              option.value,
              profileOptions,
            );
            if (suggested) setField("profileId", suggested.id);
          }}
          getOptionLabel={(option) => option.label}
          isOptionEqualToValue={(a, b) => a.value === b.value}
          renderOption={(props, option) => (
            <li {...props} key={option.value}>
              <Stack spacing={0}>
                <Typography variant="body2">{option.label}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {option.description}
                </Typography>
              </Stack>
            </li>
          )}
        />
      </Box>
      <Box sx={fieldSpan}>
        <Autocomplete
          label="Perfil de acesso"
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
    </Box>
  );
}

/** Os mesmos campos com o cabeçalho e o card da seção — o formato de página. */
export function UserGeneralSection(props: UserGeneralSectionProps) {
  return (
    <FormSection
      title="Geral"
      description="Identificação do usuário, papel funcional na escola e perfil de permissões."
    >
      <UserGeneralFields {...props} />
    </FormSection>
  );
}
