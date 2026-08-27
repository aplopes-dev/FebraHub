"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import Box from "@mui/material/Box";
import MuiLink from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import { Alert, Button, FormField, Typography } from "@/ui";
import { LOGIN_ROUTE } from "../routes";

export type PasswordRecoveryFormProps = {
  /**
   * Recebe o e-mail já validado. Lançar dentro dele vira a mensagem de erro do
   * formulário.
   */
  onSubmit: (email: string) => void | Promise<void>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function PasswordRecoveryForm({ onSubmit }: PasswordRecoveryFormProps) {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const value = email.trim();
    setSubmitError(null);

    if (!value) {
      setEmailError("Informe seu e-mail.");
      return;
    }
    if (!EMAIL_PATTERN.test(value)) {
      setEmailError("Informe um e-mail válido.");
      return;
    }
    setEmailError(undefined);
    setIsSubmitting(true);

    try {
      await onSubmit(value);
      setSentTo(value);
    } catch (error) {
      setSubmitError(
        error instanceof Error && error.message
          ? error.message
          : "Não foi possível enviar o link. Tente novamente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Box
        sx={(theme) => ({
          mb: 3,
          pb: 2.5,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
        })}
      >
        <Typography
          component="h2"
          sx={{
            fontSize: "1.125rem",
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          Recuperar senha
        </Typography>
        <Typography
          sx={{ mt: 0.5, fontSize: "0.875rem", color: "text.secondary" }}
        >
          Enviamos um link de redefinição para o e-mail da sua conta.
        </Typography>
      </Box>

      <Stack spacing={2}>
        {sentTo ? (
          // A confirmação não diz se o e-mail existe: isso entregaria quem tem
          // conta a quem só está testando endereços.
          <Alert severity="success">
            Se houver uma conta para <strong>{sentTo}</strong>, o link de
            redefinição chega em instantes.
          </Alert>
        ) : null}

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
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(undefined);
          }}
          errorMessage={emailError}
          disabled={isSubmitting}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          fullWidth
          loading={isSubmitting}
        >
          Enviar link de redefinição
        </Button>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <MuiLink
            component={Link}
            href={LOGIN_ROUTE}
            underline="hover"
            sx={{ fontSize: "0.875rem", color: "text.secondary" }}
          >
            Voltar para o login
          </MuiLink>
        </Box>
      </Stack>
    </Box>
  );
}
