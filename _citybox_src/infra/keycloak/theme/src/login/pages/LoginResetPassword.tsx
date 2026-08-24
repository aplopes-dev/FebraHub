import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button } from "@citybox/mui/atoms";
import { FormField } from "@citybox/mui/molecules";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import { devUrl } from "../getContext";
import type { KcContext } from "../KcContext";

type LoginResetPasswordKcContext = Extract<
  KcContext,
  { pageId: "login-reset-password.ftl" }
>;

/** Recuperar senha — informa o usuário/e-mail e recebe o link por e-mail. */
export default function LoginResetPassword({
  kcContext,
}: {
  kcContext: LoginResetPasswordKcContext;
}) {
  const { url, realm, message, messagesPerField } = kcContext;
  const variant = getThemeVariant(kcContext);

  const fieldLabel = !realm.loginWithEmailAllowed
    ? "Usuário"
    : realm.duplicateEmailsAllowed
      ? "Usuário ou e-mail"
      : "E-mail";
  const useEmail = realm.loginWithEmailAllowed && !realm.duplicateEmailsAllowed;

  return (
    <AuthShell
      variant={variant}
      title="Recuperar senha"
      subtitle={`Informe seu ${fieldLabel.toLowerCase()} e enviaremos um link para redefinir sua senha.`}
      back={{ href: devUrl("login.ftl") ?? url.loginUrl, label: "Voltar ao login" }}
      message={message ?? undefined}
    >
      <Box
        component="form"
        id="kc-reset-password-form"
        action={url.loginAction}
        method="post"
      >
        <Stack spacing={2.5}>
          <FormField
            id="username"
            name="username"
            label={fieldLabel}
            type={useEmail ? "email" : "text"}
            autoComplete={useEmail ? "email" : "username"}
            autoFocus
            errorMessage={
              messagesPerField.existsError("username")
                ? messagesPerField.getFirstError("username")
                : undefined
            }
          />

          <Button type="submit" variant="contained" size="large" fullWidth>
            Enviar link de recuperação
          </Button>
        </Stack>
      </Box>
    </AuthShell>
  );
}
