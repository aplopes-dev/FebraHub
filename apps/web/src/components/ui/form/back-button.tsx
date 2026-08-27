"use client";

import ArrowBack from "@mui/icons-material/ArrowBack";

import Link from "next/link";
import type { SxProps, Theme } from "@mui/material/styles";
import { Button } from "@/ui";
export type BackButtonProps = {
  href: string;
  /** Texto visível ao lado do ícone. Vazio = só ícone (headers de formulário). */
  label?: string;
  /** Acessibilidade; default: `label` ou `"Voltar"`. */
  "aria-label"?: string;
  sx?: SxProps<Theme>;
};

const backButtonSx: SxProps<Theme> = {
  minWidth: "auto",
  px: 1.5,
  py: 1.5,
  gap: 0.75,
  color: "text.primary",
  borderColor: "divider",
  bgcolor: "background.paper",
  "&:hover": {
    borderColor: "text.secondary",
    bgcolor: "action.hover",
  },
};

/**
 * Botão padrão de navegação “voltar” das telas de cadastro.
 *
 * Outlined com fundo paper — contraste no fundo da página (não usar `muted`).
 * Usar em headers de formulário, empty states e páginas “não encontrado”.
 */
export function BackButton({
  href,
  label = "",
  "aria-label": ariaLabel,
  sx,
}: BackButtonProps) {
  return (
    <Button
      component={Link}
      href={href}
      variant="outlined"
      color="inherit"
      aria-label={ariaLabel ?? (label || "Voltar")}
      startIcon={label ? <ArrowBack sx={{ fontSize: 16 }} /> : undefined}
      sx={[backButtonSx, ...(Array.isArray(sx) ? sx : sx ? [sx] : [])]}
    >
      {label ? label : <ArrowBack sx={{ fontSize: 16 }} />}
    </Button>
  );
}
