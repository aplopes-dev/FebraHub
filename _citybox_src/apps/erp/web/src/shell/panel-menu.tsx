"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import { alpha } from "@mui/material/styles";
import { NavIcon } from "@/lib/nav-icons";
import {
  flattenModuleLeaves,
  matchLeafByPath,
  type ComercioNavModule,
} from "@/lib/navigation";

type ComercioPanelMenuProps = {
  module: ComercioNavModule;
};

export function ComercioPanelMenu({ module }: ComercioPanelMenuProps) {
  const pathname = usePathname();
  const groups = module.panelGroups ?? [];
  const activeLeaf = matchLeafByPath(flattenModuleLeaves(module), pathname);

  if (groups.length === 0) {
    return null;
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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
                    px: 2,
                    py: 0.75,
                    lineHeight: 1.5,
                    typography: "caption",
                    fontWeight: 600,
                    color: "text.secondary",
                    bgcolor: "transparent",
                  }}
                >
                  {group.label}
                </ListSubheader>
              ) : undefined
            }
            sx={{
              px: 1,
              display: "flex",
              flexDirection: "column",
              gap: 1,
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
                    sx={{
                      borderRadius: 1,
                      py: 0.5,
                      minHeight: 36,
                      opacity: 0.4,
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <NavIcon name={leaf.icon} size={18} />
                    </ListItemIcon>
                    <ListItemText
                      primary={leaf.label}
                      slotProps={{
                        primary: {
                          variant: "body2",
                          noWrap: true,
                        }
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
                  sx={{
                    borderRadius: 1,
                    py: 0.5,
                    minHeight: 36,
                    "&.Mui-selected": {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.light, 0.12),
                      color: "primary.dark",
                      "& .MuiListItemIcon-root": { color: "primary.dark" },
                    },
                    "&.Mui-selected:hover": {
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.light, 0.12),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: "inherit" }}>
                      <NavIcon name={leaf.icon} size={18} />
                  </ListItemIcon>
                  <ListItemText
                    primary={leaf.label}
                    slotProps={{
                      primary: {
                        variant: "body2",
                        noWrap: true,
                      }
                    }}
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
