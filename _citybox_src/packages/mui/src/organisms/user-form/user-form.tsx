"use client";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import type { FormEvent, ReactNode } from "react";
import { Button } from "../../atoms/button";
import { Checkbox } from "../../atoms/checkbox";
import { Typography } from "../../atoms/typography";
import { FormField } from "../../molecules/form-field";
import { PasswordInput } from "../../molecules/password-input";

export type UserFormValues = {
  name: string;
  email: string;
  password?: string;
  active: boolean;
};

export type UserFormProps = {
  title?: ReactNode;
  initialValues?: Partial<UserFormValues>;
  submitLabel?: string;
  cancelLabel?: string;
  showPassword?: boolean;
  onSubmit: (values: UserFormValues) => void | Promise<void>;
  onCancel?: () => void;
  isSubmitting?: boolean;
};

const EMPTY_VALUES: UserFormValues = {
  name: "",
  email: "",
  password: "",
  active: true,
};

export function UserForm({
  title = "Usuário",
  initialValues,
  submitLabel = "Salvar",
  cancelLabel = "Cancelar",
  showPassword = true,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: UserFormProps) {
  const values: UserFormValues = {
    ...EMPTY_VALUES,
    ...initialValues,
  };

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const nextValues: UserFormValues = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      password: showPassword ? String(form.get("password") ?? "") : undefined,
      active: form.get("active") === "on",
    };
    await onSubmit(nextValues);
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack spacing={2.5}>
        {title ? (
          <Typography variant="h5" component="h2">
            {title}
          </Typography>
        ) : null}

        <FormField
          name="name"
          label="Nome"
          defaultValue={values.name}
          required
          autoComplete="name"
        />

        <FormField
          name="email"
          label="E-mail"
          type="email"
          defaultValue={values.email}
          required
          autoComplete="email"
        />

        {showPassword ? (
          <PasswordInput
            id="user-form-password"
            name="password"
            label="Senha"
            defaultValue={values.password}
            required={!initialValues?.email}
            fullWidth
          />
        ) : null}

        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Checkbox
            name="active"
            defaultChecked={values.active}
            slotProps={{ input: { "aria-label": "Usuário ativo" } }}
          />
          <Typography variant="body2">Usuário ativo</Typography>
        </Box>

        <Stack direction="row" spacing={1.5} sx={{
          justifyContent: "flex-end"
        }}>
          {onCancel ? (
            <Button type="button" variant="text" onClick={onCancel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {submitLabel}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
