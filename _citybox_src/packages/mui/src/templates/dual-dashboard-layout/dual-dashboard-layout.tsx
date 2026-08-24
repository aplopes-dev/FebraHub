"use client";

import Box from "@mui/material/Box";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import {
  DualSidebar,
  type DualSidebarProps,
} from "../../organisms/dual-sidebar";

export type DualDashboardLayoutProps = {
  children: ReactNode;
  /** Props do DualSidebar (rail + painel). */
  sidebar: DualSidebarProps;
  /** Slot full-bleed do header (acima do conteúdo). */
  header?: ReactNode;
  /** Estilos do container `<main>`. */
  mainSx?: SxProps<Theme>;
};

/**
 * Layout de backoffice com sidebar de 2 colunas + header full-bleed + main.
 *
 * ```
 * [ DualSidebar ] [ Header ]
 *                 [ Main   ]
 * ```
 */
export function DualDashboardLayout({
  children,
  sidebar,
  header,
  mainSx,
}: DualDashboardLayoutProps) {
  return (
    <Box
      sx={{
        display: "flex",
        height: "100svh",
        overflow: "hidden",
        bgcolor: "background.default",
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
          height: "100%",
          overflow: "hidden",
        }}
      >
        {header ? (
          <Box
            component="header"
            sx={{
              flexShrink: 0,
              borderBottom: 1,
              borderColor: "divider",
              bgcolor: "background.header",
              // Abaixo do DualSidebar — a sombra da col. 2 fica visível sobre o header.
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
              p: 3,
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
