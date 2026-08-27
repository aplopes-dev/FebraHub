"use client";

import Box from "@mui/material/Box";
import { alpha } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";

/**
 * Medidas do `auth-shell` do `apps/app` (Angular), convertidas de `rem` para px.
 */
/** Passo da grade decorativa do fundo. */
const GRID_STEP = 48;
/** Área útil da página — `72rem`. */
const CONTENT_MAX_WIDTH = 1152;
/** Coluna do painel a partir de `lg`; abaixo disso ele empilha sob a apresentação. */
const PANEL_COLUMN = 420;
/** Teto do painel enquanto ele está empilhado (`28rem`). */
const PANEL_MAX_WIDTH = 448;
/** Raio do painel — `0.75rem`, maior que o do tema (8px), como no Angular. */
const PANEL_RADIUS = 1.5;

export type AuthLayoutProps = {
  /** O painel da direita: o formulário. */
  children: ReactNode;
  /** Marca no topo da coluna de apresentação. */
  brand?: ReactNode;
  /** Etiqueta curta acima da chamada. */
  badge?: ReactNode;
  headline: ReactNode;
  lead?: ReactNode;
  /** Rodapé fixo no fim da página (fora da área centralizada). */
  footer?: ReactNode;
};

/**
 * Casca das telas de acesso: apresentação à esquerda, painel do formulário à
 * direita.
 *
 * ```
 * ┌──────────────────────────────────────────┐
 * │  marca                     ╭────────────╮│
 * │  etiqueta                  │            ││
 * │  chamada                   │ formulário ││
 * │  texto de apoio            ╰────────────╯│
 * ├──────────────────────────────────────────┤
 * │ rodapé                                   │
 * └──────────────────────────────────────────┘
 * ```
 *
 * Abaixo de `lg` as duas colunas viram uma pilha — a apresentação em cima, o
 * painel embaixo.
 *
 * Como o resto de `src/ui`, não conhece a marca: o conteúdo da apresentação
 * entra por props.
 */
export function AuthLayout({
  children,
  brand,
  badge,
  headline,
  lead,
  footer,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        // O `<body>` trava a altura da janela e corta o excesso; aqui é o único
        // lugar da tela que pode rolar.
        height: "100%",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Box
        component="main"
        sx={{
          position: "relative",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        <Box
          aria-hidden
          sx={(theme) => {
            const line = alpha(theme.palette.divider, 0.7);

            return {
              pointerEvents: "none",
              position: "absolute",
              inset: 0,
              opacity: 0.35,
              backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
              backgroundSize: `${GRID_STEP}px ${GRID_STEP}px`,
              // Sem a máscara a grade compete com o formulário; assim ela só
              // aparece no canto de cima à esquerda e some antes do painel.
              maskImage:
                "radial-gradient(ellipse 80% 70% at 30% 20%, black, transparent)",
            };
          }}
        />

        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: CONTENT_MAX_WIDTH,
            mx: "auto",
            px: 3,
            py: 5,
            display: "grid",
            gap: 4,
            alignItems: "center",
            gridTemplateColumns: {
              xs: "minmax(0, 1fr)",
              lg: `minmax(0, 1fr) ${PANEL_COLUMN}px`,
            },
            columnGap: { lg: 8 },
          }}
        >
          <Box>
            {brand ? <Box sx={{ mb: 3 }}>{brand}</Box> : null}

            {badge ? (
              <Typography
                component="span"
                sx={(theme) => ({
                  display: "inline-block",
                  borderRadius: "999px",
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                  px: 1.5,
                  py: 0.5,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "text.secondary",
                })}
              >
                {badge}
              </Typography>
            ) : null}

            <Typography
              component="h1"
              sx={{
                mt: badge ? 3 : 0,
                maxWidth: 448,
                // Cresce com a janela sem precisar de breakpoint.
                fontSize: "clamp(1.75rem, 1.4rem + 1vw, 2.25rem)",
                fontWeight: 600,
                lineHeight: 1.2,
                letterSpacing: "-0.02em",
              }}
            >
              {headline}
            </Typography>

            {lead ? (
              <Typography
                sx={{
                  mt: 2,
                  maxWidth: 384,
                  fontSize: "1.0625rem",
                  lineHeight: 1.55,
                  color: "text.secondary",
                }}
              >
                {lead}
              </Typography>
            ) : null}
          </Box>

          <Box
            sx={(theme) => ({
              width: "100%",
              maxWidth: { xs: PANEL_MAX_WIDTH, lg: "none" },
              mx: { xs: "auto", lg: 0 },
              p: { xs: 3, sm: 4, lg: 4.5 },
              borderRadius: PANEL_RADIUS,
              border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
              bgcolor: "background.paper",
            })}
          >
            {children}
          </Box>
        </Box>
      </Box>

      {footer ? (
        <Box
          component="footer"
          sx={(theme) => ({
            flexShrink: 0,
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.8),
            px: { xs: 2, sm: 2.5, lg: 5 },
            py: { xs: 1.5, sm: 2 },
            color: "text.secondary",
            fontSize: "0.8125rem",
            lineHeight: 1.4,
          })}
        >
          {footer}
        </Box>
      ) : null}
    </Box>
  );
}
