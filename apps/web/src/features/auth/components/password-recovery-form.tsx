"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import MuiLink from "@mui/material/Link";
import { Alert, Box, Button, Input, Stack, Typography } from "@/ui";
import { LOGIN_ROUTE } from "../routes";
import { AuthField, authInputSx } from "./auth-field";

export type PasswordRecoveryFormProps = {
  /**
   * Recebe o e-mail já validado. Lançar dentro dele vira a mensagem de erro do
   * formulário.
   */
  onSubmit: (email: string) => void | Promise<void>;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** A mesma altura do CTA do login — os dois dividem o card. */
const SUBMIT_HEIGHT = 48;

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
          Recuperar senha
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
          Enviamos um link de redefinição para o e-mail da sua conta.
        </Typography>
      </Stack>

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

        <AuthField label="E-mail" htmlFor="recovery-email">
          <Input
            id="recovery-email"
            name="email"
            type="email"
            autoComplete="username"
            autoFocus
            fullWidth
            sx={authInputSx}
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(undefined);
            }}
            error={Boolean(emailError)}
            helperText={emailError}
            disabled={isSubmitting}
          />
        </AuthField>
      </Stack>

      <Stack spacing={2} sx={{ alignItems: "center" }}>
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
            // Brilho de cima do desenho, sobre a cor da marca do `contained`.
            backgroundImage:
              "linear-gradient(180deg, rgba(255, 255, 255, 0.16) 0%, rgba(255, 255, 255, 0) 100%)",
            boxShadow: `0px 1px 2px 0px rgba(14, 18, 27, 0.24), 0px 0px 0px 1px ${theme.palette.primary.main}`,
            "&:hover": {
              boxShadow: `0px 1px 2px 0px rgba(14, 18, 27, 0.24), 0px 0px 0px 1px ${theme.palette.primary.main}`,
            },
          })}
        >
          Enviar link de redefinição
        </Button>

        <MuiLink
          component={Link}
          href={LOGIN_ROUTE}
          sx={{
            fontSize: "0.875rem",
            lineHeight: "20px",
            fontWeight: 500,
            color: "text.primary",
            textDecorationColor: "currentColor",
          }}
        >
          Voltar para o login
        </MuiLink>
      </Stack>
    </Box>
  );
}
