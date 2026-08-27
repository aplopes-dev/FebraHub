"use client";

import type { ReactNode } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {
  formSectionBoxSx,
  formSectionGridSx,
  formSectionHeaderSx,
} from "@/components/ui/form";

type SupplierSectionProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function SupplierSection({
  title,
  description,
  children,
}: SupplierSectionProps) {
  return (
    <Box component="section" sx={formSectionGridSx}>
      <Box component="header" sx={formSectionHeaderSx}>
        <Typography component="h2" variant="subtitle1" sx={{ fontWeight: 600 }}>
          {title}
        </Typography>
        <Typography variant="body2" sx={{ color: "text.secondary" }}>
          {description}
        </Typography>
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
