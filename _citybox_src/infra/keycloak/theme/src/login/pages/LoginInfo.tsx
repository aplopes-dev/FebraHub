import Box from "@mui/material/Box";
import CheckIcon from "@mui/icons-material/Check";
import { Button } from "@citybox/mui/atoms";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import type { KcContext } from "../KcContext";

type LoginInfoKcContext = Extract<KcContext, { pageId: "info.ftl" }>;

// Keycloak i18n keys → conteúdo em português
const SUCCESS_HEADERS = new Set([
  "accountUpdatedTitle",
  "accountPasswordUpdatedTitle",
  "successHeader",
]);

/**
 * Mensagem informativa — dois estados no fluxo de onboarding:
 * e-mail verificado (segue para criar senha) e conta configurada (sucesso).
 */
export default function LoginInfo({
  kcContext,
}: {
  kcContext: LoginInfoKcContext;
}) {
  const { messageHeader, actionUri, pageRedirectUri, client } = kcContext;
  const variant = getThemeVariant(kcContext);

  const isSuccess = messageHeader != null && SUCCESS_HEADERS.has(messageHeader);
  const backHref = pageRedirectUri ?? client.baseUrl;

  const ctaHref = isSuccess ? backHref : actionUri;
  const ctaLabel = isSuccess ? "Acessar o sistema" : "Criar senha";

  return (
    <AuthShell
      variant={variant}
      title={isSuccess ? "Senha criada com sucesso!" : "E-mail verificado!"}
      subtitle={
        isSuccess
          ? "Sua conta está configurada. Você já pode acessar o sistema."
          : "Agora crie uma senha para acessar a plataforma."
      }
    >
      {isSuccess && (
        <Box
          sx={{
            mb: 3,
            width: 48,
            height: 48,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "rgba(46, 125, 50, 0.1)",
            color: "success.main",
          }}
        >
          <CheckIcon />
        </Box>
      )}

      {ctaHref && (
        <Button variant="contained" size="large" fullWidth href={ctaHref}>
          {ctaLabel}
        </Button>
      )}
    </AuthShell>
  );
}
