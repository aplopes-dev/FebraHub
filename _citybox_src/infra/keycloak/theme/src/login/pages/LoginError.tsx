import Box from "@mui/material/Box";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutlineOutlined";
import Alert from "@mui/material/Alert";
import { Button } from "@citybox/mui/atoms";
import { AuthShell } from "../AuthShell";
import { getThemeVariant } from "../theme-variant";
import type { KcContext } from "../KcContext";

type LoginErrorKcContext = Extract<KcContext, { pageId: "error.ftl" }>;

/** Erro do fluxo de autenticação (link expirado, ação inválida etc.). */
export default function LoginError({
  kcContext,
}: {
  kcContext: LoginErrorKcContext;
}) {
  const { message, client } = kcContext;
  const variant = getThemeVariant(kcContext);

  const errorText =
    message?.summary ?? "Erro desconhecido. Por favor, tente novamente.";

  return (
    <AuthShell
      variant={variant}
      title="Algo deu errado"
      subtitle="Não foi possível concluir a ação."
    >
      <Box
        sx={{
          mb: 3,
          width: 48,
          height: 48,
          borderRadius: "50%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "rgba(211, 47, 47, 0.08)",
          color: "error.main",
        }}
      >
        <ErrorOutlineIcon />
      </Box>

      <Alert severity="error" variant="outlined" sx={{ mb: 3 }}>
        {errorText}
      </Alert>

      {client?.baseUrl && (
        <Button variant="contained" size="large" fullWidth href={client.baseUrl}>
          Voltar ao início
        </Button>
      )}
    </AuthShell>
  );
}
