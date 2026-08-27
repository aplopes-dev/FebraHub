"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  formSectionBoxSx,
  formSectionGridSx,
  formSectionHeaderSx,
} from "@/components/ui/form";

type FinancialEntrySectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function FinancialEntrySection({
  title,
  description,
  children,
}: FinancialEntrySectionProps) {
  return (
    <Box component="section" sx={formSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        {description ? (
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {description}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          ...formSectionBoxSx,
          display: "flex",
          flexDirection: "column",
          gap: 2.5,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
