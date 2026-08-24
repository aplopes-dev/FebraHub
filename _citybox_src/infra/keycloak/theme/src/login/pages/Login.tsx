import { useState } from "react";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import { Button, Checkbox, FormControlLabel } from "@citybox/mui/atoms";
import { FormField, PasswordInput } from "@citybox/mui/molecules";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import { devUrl } from "../getContext";
import type { KcContext } from "../KcContext";

type LoginKcContext = Extract<KcContext, { pageId: "login.ftl" }>;

/**
 * Login — layout split único para todos os realms; a identidade (cores, nome
 * da vertical, painel) vem da variante derivada do realm.
 */
export default function Login({ kcContext }: { kcContext: LoginKcContext }) {
  const { realm, url, login, auth, message, messagesPerField, usernameHidden } =
    kcContext;
  const variant = getThemeVariant(kcContext);

  const [isLoading, setIsLoading] = useState(false);

  const usernameLabel = !realm.loginWithEmailAllowed
    ? "Usuário"
    : !realm.registrationEmailAsUsername
      ? "Usuário ou e-mail"
      : "E-mail";

  const hasCredentialError = messagesPerField.existsError("username", "password");

  return (
    <AuthShell
      variant={variant}
      title="Bem-vindo de volta"
      subtitle="Entre com suas credenciais para continuar"
      message={message?.type === "error" || message?.type === "warning" ? message : undefined}
    >
      <Box
        component="form"
        id="kc-form-login"
        action={url.loginAction}
        method="post"
        onSubmit={() => setIsLoading(true)}
      >
        <Stack spacing={2.5}>
          {/* Keycloak já identificou o usuário (re-autenticação): mostra QUEM
              está entrando e oferece trocar de conta — sem isso, um campo de
              senha sozinho não diz de quem é a senha. */}
          {usernameHidden && auth?.attemptedUsername && (
            <Stack
              direction="row"
              spacing={1.5}
              sx={{
                alignItems: "center",
                justifyContent: "space-between",
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "muted.light",
                px: 1.75,
                py: 1.25,
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", minWidth: 0 }}
              >
                <AccountCircleOutlinedIcon
                  sx={{ fontSize: 20, color: "text.secondary", flexShrink: 0 }}
                />
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 600,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {auth.attemptedUsername}
                </Typography>
              </Stack>
              <Link
                href={url.loginRestartFlowUrl}
                underline="hover"
                sx={{ fontSize: 13, fontWeight: 600, flexShrink: 0 }}
              >
                Entrar com outra conta
              </Link>
            </Stack>
          )}

          {!usernameHidden && (
            <FormField
              id="username"
              name="username"
              label={usernameLabel}
              defaultValue={login.username ?? ""}
              autoComplete="username"
              autoFocus
              error={hasCredentialError}
              errorMessage={
                messagesPerField.existsError("username")
                  ? messagesPerField.getFirstError("username")
                  : undefined
              }
            />
          )}

          <Stack spacing={1}>
            <PasswordInput
              id="password"
              name="password"
              label="Senha"
              fullWidth
              autoComplete="current-password"
              autoFocus={!!usernameHidden}
              error={messagesPerField.existsError("password") || hasCredentialError}
              helperText={
                messagesPerField.existsError("password")
                  ? messagesPerField.getFirstError("password")
                  : undefined
              }
            />
            {realm.resetPasswordAllowed && (
              <Link
                href={devUrl("login-reset-password.ftl") ?? url.loginResetCredentialsUrl}
                underline="hover"
                sx={{ alignSelf: "flex-end", fontSize: 13, color: "text.secondary" }}
              >
                Esqueceu a senha?
              </Link>
            )}
          </Stack>

          {realm.rememberMe && !usernameHidden && (
            <FormControlLabel
              control={
                <Checkbox
                  id="rememberMe"
                  name="rememberMe"
                  size="small"
                  defaultChecked={!!login.rememberMe}
                />
              }
              label={
                <Typography variant="body2" sx={{ color: "text.secondary" }}>
                  Lembrar-me
                </Typography>
              }
            />
          )}

          <input
            type="hidden"
            name="credentialId"
            value={auth?.selectedCredential ?? ""}
          />

          <Button
            id="kc-login"
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={isLoading}
            startIcon={
              isLoading ? <CircularProgress size={16} color="inherit" /> : undefined
            }
          >
            {isLoading ? "Entrando…" : "Entrar"}
          </Button>
        </Stack>
      </Box>

    </AuthShell>
  );
}
