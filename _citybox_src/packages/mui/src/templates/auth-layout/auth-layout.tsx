"use client";

import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";

export type AuthLayoutProps = {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  brand?: ReactNode;
  maxWidth?: number;
};

export function AuthLayout({
  children,
  title,
  subtitle,
  brand,
  maxWidth = 420,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "background.default",
        p: 2,
      }}
    >
      <Paper
        elevation={0}
        variant="outlined"
        sx={{ width: "100%", maxWidth, p: { xs: 3, sm: 4 } }}
      >
        <Stack spacing={3}>
          {brand ? (
            <Box sx={{ display: "flex", justifyContent: "center" }}>{brand}</Box>
          ) : null}
          {(title || subtitle) && (
            <Stack spacing={0.5} sx={{
              textAlign: "center"
            }}>
              {title ? (
                <Typography variant="h5" component="h1">
                  {title}
                </Typography>
              ) : null}
              {subtitle ? (
                <Typography variant="body2" sx={{
                  color: "text.secondary"
                }}>
                  {subtitle}
                </Typography>
              ) : null}
            </Stack>
          )}
          {children}
        </Stack>
      </Paper>
    </Box>
  );
}
