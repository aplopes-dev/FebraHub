"use client";

import type { ReactNode } from "react";
import { Box, type BoxProps } from "@citybox/mui";

export type ListPageShellProps = {
  children: ReactNode;
  sx?: BoxProps["sx"];
};

/**
 * Root flex das listagens MUI do ERP Comércio
 * (PageHeader + ListPagePanel ocupam a altura do main).
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
          gap: 2,
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {children}
    </Box>
  );
}
