"use client";

import MuiDrawer from "@mui/material/Drawer";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Divider from "@mui/material/Divider";
import CloseIcon from "@mui/icons-material/Close";
import type { DrawerProps as MuiDrawerProps } from "@mui/material/Drawer";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";
import { Typography } from "../../atoms/typography";
import { ScrollArea } from "../scroll-area";

export type DrawerProps = {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Conteúdo fixo no rodapé (ações). */
  footer?: ReactNode;
  /** Largura do painel. Default: 360. */
  width?: number | string;
  anchor?: MuiDrawerProps["anchor"];
} & Omit<MuiDrawerProps, "open" | "onClose" | "anchor" | "children" | "title">;

/** Margem do painel em relação às bordas da viewport (px). */
const DRAWER_INSET = 16;

type PaperSlotProps = {
  sx?: SxProps<Theme>;
} & Record<string, unknown>;

/**
 * Drawer lateral (filtros, importação, etc.).
 * Default: `anchor="right"`.
 * Painel flutuante (inset + raio) — não colado nas margens da tela.
 * Chrome (fechar) usa ícone Material (`@mui/icons-material`), não Solar.
 */
export function Drawer({
  open,
  onClose,
  title,
  children,
  footer,
  width = 360,
  anchor = "right",
  slotProps,
  ...props
}: DrawerProps) {
  const paperFromSlots =
    slotProps?.paper != null && typeof slotProps.paper === "object"
      ? (slotProps.paper as PaperSlotProps)
      : {};
  const { sx: paperSx, ...paperRest } = paperFromSlots;

  return (
    <MuiDrawer
      open={open}
      onClose={onClose}
      anchor={anchor}
      slotProps={{
        ...slotProps,
        paper: {
          ...paperRest,
          sx: [
            {
              m: `${DRAWER_INSET}px`,
              height: `calc(100% - ${DRAWER_INSET * 2}px)`,
              maxHeight: `calc(100% - ${DRAWER_INSET * 2}px)`,
              // `1` = 1 × theme.shape.borderRadius (não passar o número cru no sx)
              borderRadius: 1,
              boxShadow: 8,
              overflow: "hidden",
            },
            ...(Array.isArray(paperSx)
              ? paperSx
              : paperSx != null
                ? [paperSx]
                : []),
          ],
        },
      }}
      {...props}
    >
      <Box
        sx={{
          width,
          maxWidth: `calc(100vw - ${DRAWER_INSET * 2}px)`,
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {title != null ? (
          <>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
                px: 2,
                py: 1.5,
              }}
            >
              <Typography
                variant="h6"
                component="h2"
                sx={{ fontSize: "1.125rem" }}
              >
                {title}
              </Typography>
              <IconButton aria-label="Fechar" onClick={onClose}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Divider />
          </>
        ) : null}
        <ScrollArea sx={{ flexGrow: 1, px: 2, py: 2 }}>{children}</ScrollArea>
        {footer != null ? (
          <>
            <Divider />
            <Box sx={{ px: 2, py: 1.5 }}>{footer}</Box>
          </>
        ) : null}
      </Box>
    </MuiDrawer>
  );
}
