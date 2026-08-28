"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";

/**
 * Medidas do frame `Sign in` do design NodeX (Figma, nó `37253:28027`),
 * lidas no render.
 */
/** Coluna da vitrine — 720px dos 1441px do frame. */
const SHOWCASE_WIDTH = 720;
/** Card do formulário. */
const CARD_WIDTH = 524;
/** Raio do card — 20px, acima do raio do tema (8px). */
const CARD_RADIUS = 20;
/**
 * Largura a partir da qual a vitrine cabe ao lado do card sem espremê-lo:
 * 524 do card + respiro + 720 da coluna. Abaixo disso sobra só o formulário,
 * centralizado na página inteira.
 */
const SHOWCASE_MIN_VIEWPORT = 1280;

export type AuthLayoutProps = {
  /** O card do centro: o formulário da rota. */
  children: ReactNode;
  /** Marca no canto superior esquerdo — a `Topbar` do design. */
  brand?: ReactNode;
  /** Coluna da direita. Some quando a janela não a comporta. */
  showcase?: ReactNode;
};

/**
 * Casca das telas de acesso — fora do shell do backoffice: sem sidebar, sem
 * header, sem empresa ativa.
 *
 * ```
 * ┌───────────────────────┬──────────────────┐
 * │ marca                 │                  │
 * │                       │     vitrine      │
 * │      ╭───────────╮    │   (ilustração    │
 * │      │   card    │    │   + depoimento)  │
 * │      ╰───────────╯    │                  │
 * └───────────────────────┴──────────────────┘
 * ```
 *
 * Como o resto de `src/ui`, não conhece a marca: marca e vitrine entram por
 * prop.
 */
export function AuthLayout({ children, brand, showcase }: AuthLayoutProps) {
  return (
    <Box
      sx={{
        // O `<body>` trava a altura da janela e corta o excesso; aqui é o único
        // lugar da tela que pode rolar.
        height: "100%",
        overflowY: "auto",
        display: "flex",
        gap: 3,
        bgcolor: "background.default",
        color: "text.primary",
      }}
    >
      <Box
        component="main"
        sx={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: 3,
          // Espaço da topbar em cima e a mesma folga embaixo, para o card ficar
          // no centro óptico da coluna e não colidir com a marca.
          py: 10,
        }}
      >
        {brand ? (
          <Box sx={{ position: "absolute", top: 0, left: 0, p: 3 }}>
            {brand}
          </Box>
        ) : null}

        <Box
          sx={(theme) => ({
            width: CARD_WIDTH,
            maxWidth: "100%",
            p: 3,
            borderRadius: `${CARD_RADIUS}px`,
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.default",
            // `drop-shadow` do design (`Alpha/Neutral/alpha-8`), não elevação
            // do MUI: o card do desenho quase não descola do fundo.
            filter: "drop-shadow(0px 1px 1px rgba(29, 38, 26, 0.08))",
          })}
        >
          {children}
        </Box>
      </Box>

      {showcase ? (
        <Box
          aria-hidden
          sx={(theme) => ({
            flexShrink: 0,
            width: SHOWCASE_WIDTH,
            alignSelf: "stretch",
            // Sem raio: no desenho quem arredonda é o frame, não esta coluna —
            // ela sangra até a borda da janela.
            border: `1px solid ${theme.palette.divider}`,
            bgcolor: "background.paper",
            overflow: "hidden",
            display: "none",
            [theme.breakpoints.up(SHOWCASE_MIN_VIEWPORT)]: {
              display: "block",
            },
          })}
        >
          {showcase}
        </Box>
      ) : null}
    </Box>
  );
}
