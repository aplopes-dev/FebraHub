import { useState } from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import CircularProgress from "@mui/material/CircularProgress";
import { Button } from "@citybox/mui/atoms";
import { PasswordInput } from "@citybox/mui/molecules";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import type { KcContext } from "../KcContext";

type LoginUpdatePasswordKcContext = Extract<
  KcContext,
  { pageId: "login-update-password.ftl" }
>;

/** Definir nova senha — primeiro acesso ou redefinição via link. */
export default function LoginUpdatePassword({
  kcContext,
}: {
  kcContext: LoginUpdatePasswordKcContext;
}) {
  const { url, message, messagesPerField, isAppInitiatedAction } = kcContext;
  const variant = getThemeVariant(kcContext);
  const [isLoading, setIsLoading] = useState(false);

  const newPasswordError = messagesPerField.existsError("password");
  const confirmError = messagesPerField.existsError("password-confirm");

  return (
    <AuthShell
      variant={variant}
      title="Criar nova senha"
      subtitle="Defina uma senha forte para proteger sua conta."
      message={message?.type === "error" || message?.type === "warning" ? message : undefined}
    >
      <Box
        component="form"
        id="kc-passwd-update-form"
        action={url.loginAction}
        method="post"
        onSubmit={() => setIsLoading(true)}
      >
        {/* Encerra outras sessões ao trocar a senha — postura conservadora. */}
        <input type="hidden" name="logout-sessions" value="on" />

        <Stack spacing={2.5}>
          <PasswordInput
            id="password-new"
            name="password-new"
            label="Nova senha"
            fullWidth
            autoComplete="new-password"
            autoFocus
            error={newPasswordError || confirmError}
            helperText={
              newPasswordError ? messagesPerField.getFirstError("password") : undefined
            }
          />

          <PasswordInput
            id="password-confirm"
            name="password-confirm"
            label="Confirmar nova senha"
            fullWidth
            autoComplete="new-password"
            error={confirmError}
            helperText={
              confirmError
                ? messagesPerField.getFirstError("password-confirm")
                : undefined
            }
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {isLoading ? "Salvando…" : "Salvar nova senha"}
          </Button>

          {isAppInitiatedAction && (
            <Button
              type="submit"
              name="cancel-aia"
              value="true"
              variant="text"
              color="inherit"
              fullWidth
              formNoValidate
            >
              Cancelar
            </Button>
          )}
        </Stack>
      </Box>
    </AuthShell>
  );
}
