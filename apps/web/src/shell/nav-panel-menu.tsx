"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { NavIcon } from "@/lib/nav-icons";
import {
  flattenModuleLeaves,
  matchLeafByPath,
  type NavModule,
} from "@/lib/navigation";

type NavPanelMenuProps = {
  module: NavModule;
};

/** Item do painel — 36px de altura, ícone 16px, rótulo 12/16 (Figma NodeX). */
const itemSx = {
  minHeight: 36,
  height: 36,
  gap: 1,
  px: 1.5,
  py: 1,
  borderRadius: 1,
  border: "1px solid transparent",
  color: "sidebar.itemContrastText",
  "&:hover": {
    bgcolor: "sidebar.itemHover",
  },
  "&.Mui-selected, &.Mui-selected:hover": {
    bgcolor: "sidebar.itemActive",
    borderColor: "sidebar.itemActiveBorder",
    color: "sidebar.itemActiveContrastText",
    "& .MuiListItemIcon-root": { color: "inherit" },
  },
} as const;

const itemIconSx = {
  minWidth: 0,
  color: "inherit",
  "& > *": { fontSize: 16, width: 16, height: 16 },
} as const;

const itemTextSx = {
  my: 0,
  "& .MuiTypography-root": {
    fontSize: 12,
    lineHeight: "16px",
    fontWeight: 500,
    color: "inherit",
  },
} as const;

export function NavPanelMenu({ module }: NavPanelMenuProps) {
  const pathname = usePathname();
  const groups = module.panelGroups ?? [];
  const activeLeaf = matchLeafByPath(flattenModuleLeaves(module), pathname);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      {groups.map((group) => {
        const key = group.label || "ungrouped";
        return (
          <List
            key={key}
            disablePadding
            subheader={
              group.label ? (
                <ListSubheader
                  disableSticky
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    fontSize: 12,
                    lineHeight: "16px",
                    fontWeight: 500,
                    letterSpacing: 0.4,
                    color: "sidebar.groupLabel",
                    bgcolor: "transparent",
                  }}
                >
                  {group.label}
                </ListSubheader>
              ) : undefined
            }
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: "2px",
            }}
          >
            {group.leaves.map((leaf) => {
              const isActive = !leaf.disabled && activeLeaf?.id === leaf.id;

              if (leaf.disabled) {
                return (
                  <ListItemButton
                    key={leaf.id}
                    disabled
                    title="Em breve"
                    sx={{ ...itemSx, opacity: 0.4 }}
                  >
                    <ListItemIcon sx={itemIconSx}>
                      <NavIcon name={leaf.icon} size={16} />
                    </ListItemIcon>
                    <ListItemText
                      primary={leaf.label}
                      sx={itemTextSx}
                      slotProps={{
                        primary: { variant: "body2", noWrap: true },
                      }}
                    />
                  </ListItemButton>
                );
              }

              return (
                <ListItemButton
                  key={leaf.id}
                  component={Link}
                  href={leaf.path}
                  selected={isActive}
                  sx={itemSx}
                >
                  <ListItemIcon sx={itemIconSx}>
                    <NavIcon name={leaf.icon} size={16} />
                  </ListItemIcon>
                  <ListItemText
                    primary={leaf.label}
                    sx={itemTextSx}
                    slotProps={{ primary: { variant: "body2", noWrap: true } }}
                  />
                </ListItemButton>
              );
            })}
          </List>
        );
      })}
    </Box>
  );
}
