"use client";

import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";

import { useState } from "react";
import Box from "@mui/material/Box";
import ListItemText from "@mui/material/ListItemText";
import { Badge, IconButton, Menu, MenuItem, Typography } from "@/ui";

type Notification = {
  id: string;
  title: string;
  description: string;
};

/**
 * Ainda não há origem de notificações — a lista fica vazia de propósito.
 *
 * O produto de origem trazia avisos de exemplo (estoque de vestuário, pedidos
 * de PDV) que davam a impressão de um recurso ligado. Preferimos o estado
 * vazio: quando houver um feed de verdade, ele entra aqui e o resto da UI já
 * está pronta.
 */
const NOTIFICATIONS: Notification[] = [];

export function NotificationsMenu() {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  function closeMenu() {
    setAnchorEl(null);
  }

  return (
    <>
      <IconButton
        size="small"
        aria-label="Notificações"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{ width: 36, height: 36, position: "relative" }}
      >
        <NotificationsOutlined sx={{ fontSize: 22 }} />
        {NOTIFICATIONS.length > 0 ? (
          <Badge
            label={NOTIFICATIONS.length}
            color="error"
            size="small"
            sx={{
              position: "absolute",
              top: 2,
              right: 2,
              height: 16,
              minWidth: 16,
              fontSize: "10px",
              "& .MuiChip-label": { px: 0.5 },
            }}
          />
        ) : null}
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { sx: { width: 320 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="subtitle2">Notificações</Typography>
        </Box>
        {NOTIFICATIONS.length === 0 ? (
          <Box sx={{ px: 2, pb: 1.5 }}>
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Nenhuma notificação por enquanto.
            </Typography>
          </Box>
        ) : (
          NOTIFICATIONS.map((item) => (
            <MenuItem
              key={item.id}
              onClick={closeMenu}
              sx={{
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 0.25,
                py: 1.25,
              }}
            >
              <ListItemText
                primary={item.title}
                secondary={item.description}
                slotProps={{
                  primary: { sx: { fontWeight: 500 } },
                  secondary: { sx: { color: "text.secondary" } },
                }}
              />
            </MenuItem>
          ))
        )}
      </Menu>
    </>
  );
}
