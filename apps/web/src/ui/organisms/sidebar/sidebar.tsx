"use client";

import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import type { ReactNode } from "react";

export type SidebarNavItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  href?: string;
};

export type SidebarProps = {
  items: SidebarNavItem[];
  brand?: ReactNode;
  width?: number;
  open?: boolean;
  variant?: "permanent" | "persistent" | "temporary";
  onClose?: () => void;
  footer?: ReactNode;
};

export function Sidebar({
  items,
  brand,
  width = 260,
  open = true,
  variant = "permanent",
  onClose,
  footer,
}: SidebarProps) {
  return (
    <Drawer
      variant={variant}
      open={open}
      onClose={onClose}
      sx={{
        width,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>{brand}</Toolbar>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1 }}>
        {items.map((item) => {
          const linkProps = item.href ? { href: item.href } : {};
          return (
            <ListItemButton
              key={item.id}
              selected={item.selected}
              onClick={item.onClick}
              {...linkProps}
              sx={{ borderRadius: 1, mb: 0.5 }}
            >
              {item.icon ? (
                <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
              ) : null}
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
      {footer ? (
        <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>{footer}</Box>
      ) : null}
    </Drawer>
  );
}
