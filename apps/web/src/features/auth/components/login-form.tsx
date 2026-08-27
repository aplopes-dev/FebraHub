"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import {
  Alert,
  BrandMark,
  Button,
  FormField,
  PasswordInput,
  Typography,
} from "@/ui";
import { AUTH_BRAND_NAME } from "@/shell/app-name";
import { PASSWORD_RECOVERY_ROUTE } from "../routes";

export type LoginFormValues = {
  email: string;
  password: string;
};

export type LoginFormProps = {
  /**
   * Recebe as credenciais já validadas. Lançar dentro dele vira a mensagem de
   * erro do formulário — é assim que a falha da API vai aparecer aqui.
   */
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
};

type FieldErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMPTY_VALUES: LoginFormValues = { email: "", password: "" };

/**
 * Só descarta o que nem parece e-mail. A validação que vale é a do servidor;
 * uma regex mais rígida aqui rejeitaria endereços legítimos.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: LoginFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.email.trim()) {
    errors.email = "Informe seu e-mail.";
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Informe um e-mail válido.";
  }

  if (!values.password) {
    errors.password = "Informe sua senha.";
  }

  return errors;
}

export function LoginForm({ onSubmit }: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function change(field: keyof LoginFormValues, value: string) {
    setValues((prev) => ({ ...prev, [field]: value }));
    // O erro sai assim que o campo é mexido: reclamar do que a pessoa já está
    // corrigindo não ajuda.
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(null);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({ email: values.email.trim(), password: values.password });
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível entrar. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Stack
        direction="row"
        spacing={1.5}
        sx={(theme) => ({
          alignItems: "center",
          mb: 3,
          pb: 2.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        })}
      >
        <BrandMark width={28} height={40} title={AUTH_BRAND_NAME} />
        <Typography
          component="h2"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Acesso ao sistema
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {submitError ? (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        ) : null}

        <FormField
          name="email"
          label="E-mail"
          type="email"
          autoComplete="username"
          autoFocus
          value={values.email}
          onChange={(event) => change("email", event.target.value)}
          errorMessage={errors.email}
          disabled={isSubmitting}
        />

        <PasswordInput
          name="password"
          label="Senha"
          autoComplete="current-password"
          fullWidth
          value={values.password}
          onChange={(event) => change("password", event.target.value)}
          error={Boolean(errors.password)}
          helperText={errors.password}
          disabled={isSubmitting}
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: -1 }}>
          <MuiLink
            component={Link}
            href={PASSWORD_RECOVERY_ROUTE}
            underline="hover"
            sx={{ fontSize: "0.875rem", color: "text.secondary" }}
          >
            Esqueceu a senha?
          </MuiLink>
        </Box>

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={isSubmitting}
        >
          Entrar
        </Button>
      </Stack>
    </Box>
  );
}
