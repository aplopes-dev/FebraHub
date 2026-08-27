"use client";

import type { ReactNode } from "react";
import { Box, type BoxProps } from "@/ui";

export type ListPageShellProps = {
  children: ReactNode;
  sx?: BoxProps["sx"];
};

/**
 * Root flex das listagens MUI do sistema
 * (PageHeader + ListPagePanel ocupam a altura do main).
 *
 * `gap: 20px` — a distância entre o cabeçalho da página e o box de conteúdo
 * no design, a mesma do padding do `main`.
 */
export function ListPageShell({ children, sx }: ListPageShellProps) {
  return (
    <Box
      sx={[
        {
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          gap: 2.5,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
