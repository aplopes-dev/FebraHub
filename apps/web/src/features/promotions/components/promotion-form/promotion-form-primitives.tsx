"use client";

import type { ReactNode } from "react";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { Tooltip } from "@/ui";
import {
  formSectionBoxSx,
  formSectionGridSx,
  formSectionHeaderSx,
} from "@/components/ui/form";

/** Mantido para o grid dos grupos na Etapa 1 (mesmo layout de seção). */
export const PROMOTION_SECTION_GRID_SX = formSectionGridSx;

type PromotionSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

/** Sessão do formulário: cabeçalho à esquerda + caixa de conteúdo à direita. */
export function PromotionSection({
  title,
  description,
  children,
}: PromotionSectionProps) {
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

/** Ícone de informação com tooltip explicativo. */
export function InfoTooltip({ text }: { text: string }) {
  return (
    <Tooltip title={text} arrow>
      <IconButton
        type="button"
        size="small"
        aria-label="Mais informações"
        sx={{ color: "text.secondary", p: 0.25 }}
      >
        <InfoOutlinedIcon sx={{ fontSize: 16 }} aria-hidden />
      </IconButton>
    </Tooltip>
  );
}

type PromotionFieldProps = {
  label: string;
  htmlFor?: string;
  info?: string;
  optional?: boolean;
  children: ReactNode;
};

/** Campo rotulado, com tooltip opcional e marca de "opcional". */
export function PromotionField({
  label,
  htmlFor,
  info,
  optional,
  children,
}: PromotionFieldProps) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
        <Typography
          component="label"
          htmlFor={htmlFor}
          variant="body2"
          sx={{ fontWeight: 500 }}
        >
          {label}
        </Typography>
        {optional ? (
          <Typography variant="caption" sx={{ color: "text.secondary" }}>
            (opcional)
          </Typography>
        ) : null}
        {info ? <InfoTooltip text={info} /> : null}
      </Stack>
      {children}
    </Stack>
  );
}
