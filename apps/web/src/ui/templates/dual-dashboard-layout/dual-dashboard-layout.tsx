"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  DualSidebar,
  type DualSidebarProps,
} from "../../organisms/dual-sidebar";
import { pagePaddingSx } from "../page-metrics";


/** Faixa responsiva da casca — espelha `ShellLayoutMode` do shell. */
export type DualDashboardShellMode = "desktop" | "tablet" | "mobile";

export type DualDashboardLayoutProps = {
  children: ReactNode;
  /** Props do DualSidebar (rail + painel). */
  sidebar: DualSidebarProps;
  /** Slot full-bleed do header (topo do container de conteúdo). */
  header?: ReactNode;
  /** Estilos do container `<main>`. */
  mainSx?: SxProps<Theme>;
  /** Faixa responsiva atual; afeta inset e padding. Default: `desktop`. */
  shellMode?: DualDashboardShellMode;
};

/**
 * Medidas do inset (Figma NodeX, `Dashboard - Features` — nó `37166:23304`).
 *
 * O container de conteúdo não encosta nas bordas da janela: flutua sobre a
 * moldura escura (`sidebar.canvas`) com 8px de folga em cima, à direita e
 * embaixo. À esquerda ele encosta na sidebar — só os cantos arredondados
 * deixam a moldura aparecer ali.
 */
const INSET_GAP = 1; // 8px
const INSET_RADIUS = "12px";

/**
 * Layout de backoffice: sidebar de 2 colunas + coluna de conteúdo com header e
 * main.
 */
export function DualDashboardLayout({
  children,
  sidebar,
  header,
  mainSx,
  shellMode = "desktop",
}: DualDashboardLayoutProps) {
  const useInsetChrome = shellMode !== "mobile";

  return (
    <Box
      sx={{
        display: "flex",
        height: "100svh",
        overflow: "hidden",
        bgcolor: useInsetChrome ? "sidebar.canvas" : "background.default",
      }}
    >
      <DualSidebar {...sidebar} />
      <Box
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          minHeight: 0,
          overflow: "hidden",
          bgcolor: "background.default",
          ...(useInsetChrome
            ? {
                mt: INSET_GAP,
                mr: INSET_GAP,
                mb: INSET_GAP,
                borderRadius: INSET_RADIUS,
                border: 1,
                borderColor: "divider",
                overflowX: "hidden",
              }
            : null),
        }}
      >
        {header ? (
          <Box
            component="header"
            sx={{
              flexShrink: 0,
              ...(useInsetChrome
                ? { borderBottom: 1, borderColor: "divider" }
                : null),
              bgcolor: "background.header",
              zIndex: 0,
            }}
          >
            {header}
          </Box>
        ) : null}
        <Box
          component="main"
          sx={[
            {
              flexGrow: 1,
              minHeight: 0,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              ...pagePaddingSx,
            },
            ...(Array.isArray(mainSx) ? mainSx : mainSx ? [mainSx] : []),
          ]}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
}
