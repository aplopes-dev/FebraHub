"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import MuiLink from "@mui/material/Link";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import type { Theme } from "@mui/material/styles";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Input,
  PasswordInput,
  Stack,
  Typography,
} from "@/ui";
import { AUTH_BRAND_NAME } from "@/shell/app-name";
import { PASSWORD_RECOVERY_ROUTE } from "../routes";
import { AuthField, authInputSx } from "./auth-field";

export type LoginFormValues = {
  email: string;
  password: string;
  /** Marcado, a sessão deve sobreviver ao fechamento do navegador. */
  rememberMe: boolean;
};

export type LoginFormProps = {
  /**
   * Recebe as credenciais já validadas. Lançar dentro dele vira a mensagem de
   * erro do formulário — é assim que a falha da API vai aparecer aqui.
   */
  onSubmit: (values: LoginFormValues) => void | Promise<void>;
};

type FieldErrors = Partial<Record<"email" | "password", string>>;

const EMPTY_VALUES: LoginFormValues = {
  email: "",
  password: "",
  rememberMe: false,
};

/**
 * Só descarta o que nem parece e-mail. A validação que vale é a do servidor;
 * uma regex mais rígida aqui rejeitaria endereços legítimos.
 */
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Altura do CTA no design NodeX (Figma, nó `37253:28274`). */
const SUBMIT_HEIGHT = 48;
/** Lado da caixa do checkbox (nó `37261:29255`). */
const CHECKBOX_SIZE = 20;

/** A caixa do checkbox do desenho — o MUI desenha um ícone, o design, um box. */
function checkboxBoxSx(theme: Theme) {
  return {
    boxSizing: "border-box",
    width: CHECKBOX_SIZE,
    height: CHECKBOX_SIZE,
    borderRadius: "4px",
    border: `1px solid ${theme.palette.divider}`,
    bgcolor: "background.default",
    boxShadow: "0px 1px 2px 0px rgba(6, 27, 22, 0.06)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  } as const;
}

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

  function change(field: "email" | "password", value: string) {
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
      await onSubmit({ ...values, email: values.email.trim() });
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
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{ display: "flex", flexDirection: "column", gap: 3 }}
    >
      <Stack spacing={1} sx={{ alignItems: "center", textAlign: "center" }}>
        <Typography
          component="h1"
          sx={{ fontSize: "2rem", lineHeight: "40px", fontWeight: 600 }}
        >
          Bem-vindo de volta
        </Typography>
        <Typography
          sx={{
            maxWidth: 394,
            fontSize: "0.875rem",
            lineHeight: "20px",
            fontWeight: 500,
            color: "text.secondary",
          }}
        >
          Acesse o workspace do {AUTH_BRAND_NAME}.
        </Typography>
      </Stack>

      <Stack spacing={2}>
        {submitError ? (
          <Alert severity="error" onClose={() => setSubmitError(null)}>
            {submitError}
          </Alert>
        ) : null}

        <AuthField label="E-mail" htmlFor="login-email">
          <Input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            fullWidth
            sx={authInputSx}
            value={values.email}
            onChange={(event) => change("email", event.target.value)}
            error={Boolean(errors.email)}
            helperText={errors.email}
            disabled={isSubmitting}
          />
        </AuthField>

        <AuthField label="Senha" htmlFor="login-password">
          <PasswordInput
            id="login-password"
            name="password"
            autoComplete="current-password"
            fullWidth
            sx={authInputSx}
            value={values.password}
            onChange={(event) => change("password", event.target.value)}
            error={Boolean(errors.password)}
            helperText={errors.password}
            disabled={isSubmitting}
          />
        </AuthField>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Checkbox
              id="login-remember-me"
              name="rememberMe"
              disableRipple
              checked={values.rememberMe}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  rememberMe: event.target.checked,
                }))
              }
              disabled={isSubmitting}
              sx={{ p: 0 }}
              icon={<Box sx={checkboxBoxSx} />}
              checkedIcon={
                <Box
                  sx={[
                    checkboxBoxSx,
                    (theme) => ({
                      bgcolor: theme.palette.primary.main,
                      borderColor: theme.palette.primary.main,
                    }),
                  ]}
                >
                  <CheckRoundedIcon
                    sx={{ fontSize: 14, color: "primary.contrastText" }}
                  />
                </Box>
              }
            />
            <Box
              component="label"
              htmlFor="login-remember-me"
              sx={{
                fontSize: "0.875rem",
                lineHeight: "20px",
                color: "text.secondary",
                cursor: "pointer",
              }}
            >
              Manter-me conectado no {AUTH_BRAND_NAME}
            </Box>
          </Box>

          <MuiLink
            component={Link}
            href={PASSWORD_RECOVERY_ROUTE}
            sx={{
              flexShrink: 0,
              fontSize: "0.875rem",
              lineHeight: "20px",
              fontWeight: 500,
              color: "text.primary",
              textDecorationColor: "currentColor",
            }}
          >
            Esqueceu a senha?
          </MuiLink>
        </Box>
      </Stack>

      <Button
        type="submit"
        variant="contained"
        fullWidth
        loading={isSubmitting}
        sx={(theme) => ({
          height: SUBMIT_HEIGHT,
          fontSize: "1rem",
          lineHeight: "24px",
          fontWeight: 500,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          // Brilho de cima do desenho. Tem alpha, então cai sobre a cor da
          // marca que o `contained` já pinta no `background-color`.
          backgroundImage:
            "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 100%)",
          boxShadow: `0px 1px 2px 0px rgba(14, 18, 27, 0.24), 0px 0px 0px 1px ${theme.palette.primary.main}`,
          "&:hover": {
            boxShadow: `0px 1px 2px 0px rgba(14, 18, 27, 0.24), 0px 0px 0px 1px ${theme.palette.primary.main}`,
          },
        })}
      >
        Entrar
      </Button>
    </Box>
  );
}
