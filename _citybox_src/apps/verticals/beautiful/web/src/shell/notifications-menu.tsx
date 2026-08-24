'use client';

import NotificationsOutlined from '@mui/icons-material/NotificationsOutlined';
import { useState } from 'react';
import Box from '@mui/material/Box';
import { Badge, IconButton, Menu, MenuItem, Typography } from '@citybox/mui';

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'Novo agendamento',
    description: 'Maria Silva · Corte + Escova · 15:30',
  },
  {
    id: 'n2',
    title: 'Cliente na lista de espera',
    description: 'João Pedro aguardando horário com Ana',
  },
  {
    id: 'n3',
    title: 'Lembrete de retorno',
    description: '3 clientes com retorno previsto para amanhã',
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
        sx={{ width: 36, height: 36, position: 'relative' }}
      >
        <NotificationsOutlined sx={{ fontSize: 16 }} />
        <Badge
          label={MOCK_NOTIFICATIONS.length}
          color="error"
          size="small"
          sx={{
            position: 'absolute',
            top: 2,
            right: 2,
            height: 16,
            minWidth: 16,
            fontSize: '10px',
            '& .MuiChip-label': { px: 0.5 },
          }}
        />
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
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
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 0.25,
              py: 1.25,
              whiteSpace: 'normal',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600 }}>
              {item.title}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {item.description}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
