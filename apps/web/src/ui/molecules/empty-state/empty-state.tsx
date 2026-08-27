"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import { Typography } from "../../atoms/typography";

export type EmptyStateProps = {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  icon?: ReactNode;
  sx?: BoxProps["sx"];
};

/**
 * Estado vazio de listagem / detalhe — título, descrição opcional e ação.
 */
export function EmptyState({
  title,
  description,
  action,
  icon,
  sx,
}: EmptyStateProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1.5,
          py: 8,
          px: 3,
          textAlign: "center",
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {icon ? (
        <Box sx={{ color: "text.secondary", mb: 0.5 }}>{icon}</Box>
      ) : null}
      <Typography variant="h6" component="p" sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      {description ? (
        <Typography variant="body2" sx={{ color: "text.secondary", maxWidth: 420 }}>
          {description}
        </Typography>
      ) : null}
      {action ? <Box sx={{ mt: 1 }}>{action}</Box> : null}
    </Box>
  );
}
