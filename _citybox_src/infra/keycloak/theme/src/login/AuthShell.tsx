import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Alert from "@mui/material/Alert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CityboxMuiProvider } from "@citybox/mui/theme";
import { Logo } from "@citybox/mui/molecules";
import { THEME_VARIANTS, type ThemeVariant } from "./theme-variant";
import { getNeutralTheme } from "./variant-theme";
import { VisualPanel } from "./VisualPanel";

/** Mensagem global do kcContext (`kcContext.message`). */
type KcMessage = {
  type: "success" | "warning" | "error" | "info";
  summary: string;
};

type AuthShellProps = {
  variant: ThemeVariant;
  title: string;
  subtitle?: string;
  /** Link "voltar" acima do título (ex.: voltar ao login). */
  back?: { href: string; label: string };
  /** Mensagem global do Keycloak — vira um `Alert` MUI acima do form. */
  message?: KcMessage;
  children: ReactNode;
};

/**
 * Marca no topo do form: logo CityBox + nome da vertical em destaque.
 * White-label: sem cor de produto — o nome grande é o identificador.
 */
function Brand({ label }: { label: string }) {
  return (
    <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", mb: 5 }}>
      <Logo variant="full" height={28} />
      <Box
        aria-hidden
        sx={{ width: "1px", alignSelf: "stretch", bgcolor: "divider" }}
      />
      <Typography
        component="span"
        sx={{
          fontSize: 20,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: "text.primary",
          whiteSpace: "nowrap",
          lineHeight: 1,
        }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

/** Miolo comum: marca, voltar, título, alert global, form e rodapé. */
function FormContent({
  variant,
  title,
  subtitle,
  back,
  message,
  children,
}: AuthShellProps) {
  const config = THEME_VARIANTS[variant];

  return (
    <>
      <Brand label={config.label} />

      {back && (
        <Link
          href={back.href}
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 0.5,
            mb: 3,
            fontSize: 13,
            color: "text.secondary",
            "&:hover": { color: "text.primary" },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 15 }} />
          {back.label}
        </Link>
      )}

      <Stack spacing={0.5} sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" sx={{ letterSpacing: "-0.02em" }}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {subtitle}
          </Typography>
        )}
      </Stack>

      {message && (
        <Alert severity={message.type} variant="outlined" sx={{ mb: 3 }}>
          {message.summary}
        </Alert>
      )}

      {children}

      <Typography
        variant="caption"
        component="p"
        sx={{ mt: 5, textAlign: "center", color: "text.secondary" }}
      >
        © {new Date().getFullYear()} CityBox. Todos os direitos reservados.
      </Typography>
    </>
  );
}

/**
 * Casca comum de TODAS as páginas do tema. White-label: o tema MUI é neutro e
 * igual em todos os sistemas — o que muda por variante é o **layout**
 * (`THEME_VARIANTS[variant].layout`):
 *
 * - `split-right`: form à esquerda + painel à direita
 * - `split-left`:  painel à esquerda + form à direita
 * - `centered`:    form centralizado, sem painel
 * - `panel-card`:  card branco flutuando sobre o painel escuro em tela cheia
 *
 * Cada página só entrega o form; marca (logo + nome da vertical), mensagem
 * global e rodapé moram aqui para as sete telas ficarem idênticas em estrutura.
 */
export function AuthShell(props: AuthShellProps) {
  const { variant } = props;
  const { layout } = THEME_VARIANTS[variant];
  const theme = getNeutralTheme();

  if (layout === "centered") {
    return (
      <CityboxMuiProvider theme={theme}>
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            px: { xs: 3, sm: 6 },
            py: 6,
          }}
        >
          <Box sx={{ width: "100%", maxWidth: 400 }}>
            <FormContent {...props} />
          </Box>
        </Box>
      </CityboxMuiProvider>
    );
  }

  if (layout === "panel-card") {
    return (
      <CityboxMuiProvider theme={theme}>
        <Box sx={{ position: "relative", minHeight: "100vh" }}>
          <Box sx={{ position: "absolute", inset: 0 }}>
            <VisualPanel variant={variant} mode="backdrop" />
          </Box>
          <Box
            sx={{
              position: "relative",
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 2, sm: 4 },
              py: 6,
            }}
          >
            <Paper
              elevation={0}
              sx={{
                width: "100%",
                maxWidth: 440,
                borderRadius: 4,
                p: { xs: 3, sm: 5 },
                boxShadow: "0 24px 80px rgba(0,0,0,0.45)",
              }}
            >
              <FormContent {...props} />
            </Paper>
          </Box>
        </Box>
      </CityboxMuiProvider>
    );
  }

  // Layouts split — a ordem das colunas define o lado do painel.
  const isPanelLeft = layout === "split-left";

  return (
    <CityboxMuiProvider theme={theme}>
      <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
        {/* Coluna do formulário */}
        <Box
          sx={{
            width: { xs: "100%", md: "50%" },
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            px: { xs: 3, sm: 6, lg: 10 },
            py: 6,
            order: isPanelLeft ? 2 : 1,
          }}
        >
          <Box sx={{ mx: "auto", width: "100%", maxWidth: 400 }}>
            <FormContent {...props} />
          </Box>
        </Box>

        {/* Coluna do painel ilustrativo (desktop) */}
        <Box
          sx={{
            display: { xs: "none", md: "block" },
            position: "sticky",
            top: 0,
            height: "100vh",
            width: "50%",
            order: isPanelLeft ? 1 : 2,
          }}
        >
          <VisualPanel variant={variant} />
        </Box>
      </Box>
    </CityboxMuiProvider>
  );
}
