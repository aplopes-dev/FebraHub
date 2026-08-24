import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import { Button } from "@citybox/mui/atoms";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import type { KcContext } from "../KcContext";

type LogoutConfirmKcContext = Extract<KcContext, { pageId: "logout-confirm.ftl" }>;

/** Confirmação de logout — POST com `session_code` para `logoutConfirmAction`. */
export default function LogoutConfirm({
  kcContext,
}: {
  kcContext: LogoutConfirmKcContext;
}) {
  const { url, client, logoutConfirm } = kcContext;
  const variant = getThemeVariant(kcContext);

  const showBackLink = !logoutConfirm.skipLink && client.baseUrl;

  return (
    <AuthShell
      variant={variant}
      title="Sair da conta?"
      subtitle="Você precisará entrar novamente para acessar o sistema."
    >
      <Box component="form" action={url.logoutConfirmAction} method="post">
        <input type="hidden" name="session_code" value={logoutConfirm.code} />
        <Stack spacing={1.5}>
          <Button
            type="submit"
            name="confirmLogout"
            variant="contained"
            size="large"
            fullWidth
          >
            Sair
          </Button>

          {showBackLink && (
            <Button variant="text" color="inherit" fullWidth href={client.baseUrl}>
              Voltar ao sistema
            </Button>
          )}
        </Stack>
      </Box>
    </AuthShell>
  );
}
