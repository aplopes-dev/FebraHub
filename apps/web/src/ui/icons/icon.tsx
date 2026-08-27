"use client";

import { Icon as IconifyIcon } from "@iconify/react";
import Box from "@mui/material/Box";
import type { BoxProps } from "@mui/material/Box";
import { useIconsContext } from "./icons-provider";
import {
  resolveIconId,
  type IconName,
  type IconVariant,
} from "./registry";

export type IconProps = {
  /** Nome semântico — não use IDs do Solar/Iconify aqui. */
  name: IconName;
  /**
   * Estilo Solar. Se omitido, usa o `variant` do `IconsProvider`
   * (ou `linear` se não houver provider).
   */
  variant?: IconVariant;
  /** Tamanho em px (número) ou CSS. Default: 24. */
  size?: number | string;
  /**
   * Cor do ícone. Default: `currentColor` (herda do pai / tema).
   * Aceita token MUI via sx do wrapper se preferir.
   */
  color?: string;
} & Omit<BoxProps, "children" | "color" | "fontSize">;

/**
 * Ícone semântico do design system.
 *
 * @example
 * <Icon name="home" />
 * <Icon name="settings" size={20} />
 * <Icon name="sales" variant="bold" color="primary.main" />
 */
export function Icon({
  name,
  variant: variantProp,
  size = 24,
  color = "currentColor",
  sx,
  ...props
}: IconProps) {
  const { variant: contextVariant } = useIconsContext();
  const variant = variantProp ?? contextVariant;
  const iconId = resolveIconId(name, variant);

  return (
    <Box
      component="span"
      aria-hidden
      sx={[
        {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: size,
          height: size,
          color,
          flexShrink: 0,
          lineHeight: 0,
          "& svg": { width: "100%", height: "100%" },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      {...props}
    >
      <IconifyIcon
        icon={iconId}
        width="100%"
        height="100%"
      />
    </Box>
  );
}
