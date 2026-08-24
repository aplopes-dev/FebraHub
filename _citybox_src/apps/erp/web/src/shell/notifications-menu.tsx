"use client";

import NotificationsOutlined from "@mui/icons-material/NotificationsOutlined";

import { useState } from "react";
import Box from "@mui/material/Box";
import ListItemText from "@mui/material/ListItemText";
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Typography,
} from "@citybox/mui";
const MOCK_NOTIFICATIONS = [
  {
    id: "n1",
    title: "Estoque baixo",
    description: "Camisa Polo Azul · 3 unidades restantes",
  },
  {
    id: "n2",
    title: "Novo pedido no PDV",
    description: "Pedido #1042 aguardando confirmação",
  },
] as const;

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
        <Badge
          label={MOCK_NOTIFICATIONS.length}
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
        {MOCK_NOTIFICATIONS.map((item) => (
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
        ))}
      </Menu>
    </>
  );
}
