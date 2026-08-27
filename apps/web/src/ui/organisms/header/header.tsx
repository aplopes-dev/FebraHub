"use client";

import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";

export type HeaderProps = {
  title?: ReactNode;
  /** Conteúdo à esquerda (logo, menu toggle…). */
  startAdornment?: ReactNode;
  /** Conteúdo à direita (busca, avatar, ações…). */
  endAdornment?: ReactNode;
  elevation?: number;
};

export function Header({
  title,
  startAdornment,
  endAdornment,
  elevation = 0,
}: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      color="inherit"
      elevation={elevation}
      sx={{ borderBottom: 1, borderColor: "divider" }}
    >
      <Toolbar sx={{ gap: 2, minHeight: 64 }}>
        {startAdornment}
        {title ? (
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
        ) : (
          <Box sx={{ flexGrow: 1 }} />
        )}
        {endAdornment}
      </Toolbar>
    </AppBar>
  );
}
