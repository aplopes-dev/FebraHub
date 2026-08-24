"use client";

import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";

export type PageHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  /** Slot à direita (botões de ação). */
  actions?: ReactNode;
} & Omit<BoxProps, "title" | "children">;

/**
 * Cabeçalho de página de feature (título + ações).
 * Diferente do organism `Header` (AppBar do shell).
 */
export function PageHeader({
  title,
  description,
  actions,
  sx,
  ...props
}: PageHeaderProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 2,
          flexWrap: "wrap",
          mb: 2,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" component="h1">
          {title}
        </Typography>
        {description != null ? (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              mt: 0.5
            }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      {actions != null ? (
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexShrink: 0,
          }}
        >
          {actions}
        </Box>
      ) : null}
    </Box>
  );
}
