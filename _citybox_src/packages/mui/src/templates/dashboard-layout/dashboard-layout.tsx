"use client";

import Box from "@mui/material/Box";
import type { ReactNode } from "react";
import { Header, type HeaderProps } from "../../organisms/header";
import { Sidebar, type SidebarProps } from "../../organisms/sidebar";

export type DashboardLayoutProps = {
  children: ReactNode;
  header?: HeaderProps;
  sidebar?: SidebarProps;
  /** Largura do sidebar — deve bater com `sidebar.width`. Default: 260. */
  sidebarWidth?: number;
};

export function DashboardLayout({
  children,
  header,
  sidebar,
  sidebarWidth = 260,
}: DashboardLayoutProps) {
  const width = sidebar?.width ?? sidebarWidth;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      {sidebar ? <Sidebar width={width} {...sidebar} /> : null}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          width: sidebar ? `calc(100% - ${width}px)` : "100%",
        }}
      >
        {header ? <Header {...header} /> : null}
        <Box sx={{ flexGrow: 1, p: 3 }}>{children}</Box>
      </Box>
    </Box>
  );
}
