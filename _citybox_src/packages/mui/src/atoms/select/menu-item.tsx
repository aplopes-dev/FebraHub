"use client";

/**
 * Reexport tipado como OverridableComponent do MUI — preserva
 * `component={Link}` + `href` (necessário p/ nextjs-toploader nas row actions).
 */
export { default as MenuItem } from "@mui/material/MenuItem";
export type { MenuItemProps } from "@mui/material/MenuItem";
