'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/lib/color-mode';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import GroupOutlinedIcon from '@mui/icons-material/GroupOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import {
  Avatar,
  Box,
  Divider,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from '@citybox/mui/atoms';
import { toast } from '@citybox/mui/molecules';
import { useAuthSession } from '@/lib/session-context';
import {
  getCurrentSessionUser,
  loginAsUser,
} from '@/features/settings/services/settings-service';
import {
  primarySoftShadow,
} from '@/theme/accent-styles';
import { listifyElevatedSurface, listifyElevatedSurfaceStyles } from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';
import { USER_ROLE_LABEL } from '@/features/settings/types';
import { useSessionPermissions } from '@/features/settings/hooks/use-session-permissions';
import { useTeamMembersQuery } from '@/features/settings/hooks/use-settings-queries';
import { writeStoredFilter } from '@/features/calendar/utils/list-filter-storage';

export type CurrentUser = {
  id: string;
  name: string;
  role: string;
  initials: string;
  email: string;
  photoUrl?: string;
};

export function UserMenu({ user }: { user: CurrentUser }) {
  const queryClient = useQueryClient();
  const { canAnySettings } = useSessionPermissions();
  const { data: members = [] } = useTeamMembersQuery();
  const { status: authStatus, logout: ssoLogout } = useAuthSession();
  const ssoActive = authStatus === 'authenticated';
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  const otherUsers = useMemo(
    () => members.filter((item) => item.active && item.id !== user.id),
    [members, user.id],
  );

  function handleClose() {
    setAnchorEl(null);
  }

  function handleSwitchUser(userId: string) {
    const next = loginAsUser(userId);
    handleClose();
    if (!next) {
      toast.error('Não foi possível trocar de usuário');
      return;
    }
    queryClient.invalidateQueries();
    writeStoredFilter('mine');
    toast.success(
      next.mustChangePassword
        ? `Primeiro acesso de ${next.name}`
        : `Sessão mock: ${next.name}`,
    );
  }

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-haspopup="menu"
        aria-expanded={open ? 'true' : undefined}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: { xs: 0, sm: 0.5 },
          border: 0,
          borderRadius: '999px',
          p: { xs: 0.25, sm: 0.5 },
          bgcolor: 'transparent',
          color: 'text.primary',
          cursor: 'pointer',
          textAlign: 'left',
          transition: 'background-color 0.15s',
          '&:hover': { bgcolor: 'secondary.main' },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: 2,
          },
        }}
      >
        <Stack direction="row" spacing={{ xs: 0, sm: 1.5 }} sx={{ alignItems: 'center' }}>
          <Avatar
            src={user.photoUrl}
            alt={user.photoUrl ? `Foto de ${user.name}` : undefined}
            sx={{
              width: { xs: 36, sm: 40, md: 48 },
              height: { xs: 36, sm: 40, md: 48 },
              bgcolor: (theme) => listifyElevatedSurface(theme),
              color: 'text.secondary',
              fontWeight: 500,
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
            }}
          >
            {user.initials}
          </Avatar>
          <Box sx={{ display: { xs: 'none', md: 'block' }, minWidth: 0, maxWidth: 120 }}>
            <Typography
              sx={{
                fontSize: '1.125rem',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                lineHeight: 1.4,
                color: 'inherit',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.name}
            </Typography>
            <Typography
              color="text.secondary"
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                lineHeight: 1.55,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {user.role}
            </Typography>
          </Box>
        </Stack>
        <ExpandMoreIcon
          sx={{
            fontSize: 24,
            color: 'text.secondary',
            flexShrink: 0,
            display: { xs: 'none', sm: 'block' },
          }}
        />
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: (theme) => ({
              width: 288,
              mt: 1,
              borderRadius: '16px',
              ...listifyElevatedSurfaceStyles(theme),
              boxShadow:
                theme.palette.mode === 'dark' ? listifyShadows.lg : listifyShadows.md,
              backgroundImage: 'none',
            }),
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 500 }}>
            {user.name}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            {user.email}
          </Typography>
        </Box>

        <Divider />

        <ThemeSwitch />

        <Divider />

        {otherUsers.length > 0 && !ssoActive ? (
          <>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                px: 2,
                py: 1,
              }}
            >
              <GroupOutlinedIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Entrar como (mock)
              </Typography>
            </Box>
            {otherUsers.map((item) => (
              <MenuItem key={item.id} onClick={() => handleSwitchUser(item.id)}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <Avatar
                    sx={{
                      width: 28,
                      height: 28,
                      bgcolor: 'secondary.main',
                      color: 'text.primary',
                      fontSize: 10,
                      fontWeight: 600,
                    }}
                  >
                    {item.initials}
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  secondary={`${USER_ROLE_LABEL[item.role]}${
                    item.mustChangePassword ? ' · 1º acesso' : ''
                  }`}
                  slotProps={{
                    primary: {
                      noWrap: true,
                      sx: { fontSize: '0.875rem' },
                    },
                    secondary: {
                      noWrap: true,
                      component: 'span',
                      sx: { fontSize: '0.75rem', display: 'block' },
                    },
                  }}
                />
                {item.id === getCurrentSessionUser()?.id ? (
                  <CheckIcon sx={{ fontSize: 16, color: 'primary.main', ml: 1 }} />
                ) : null}
              </MenuItem>
            ))}
            <Divider />
          </>
        ) : null}

        <MenuItem component={Link} href="/help" onClick={handleClose}>
          <ListItemIcon sx={{ color: 'text.secondary' }}>
            <SupportAgentOutlinedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Ajuda & Suporte</ListItemText>
        </MenuItem>

        {canAnySettings() ? (
          <MenuItem component={Link} href="/settings" onClick={handleClose}>
            <ListItemIcon sx={{ color: 'text.secondary' }}>
              <SettingsOutlinedIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Configurações</ListItemText>
          </MenuItem>
        ) : null}

        <MenuItem
          onClick={() => {
            handleClose();
            if (ssoActive) {
              void ssoLogout();
              return;
            }
            toast.success('Sessão encerrada');
          }}
          sx={{ color: 'error.main' }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sair</ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}

const THEME_OPTIONS = [
  { value: 'light', label: 'Claro', Icon: LightModeOutlinedIcon },
  { value: 'dark', label: 'Escuro', Icon: DarkModeOutlinedIcon },
] as const;

function ThemeSwitch() {
  const { theme, setTheme } = useTheme();

  return (
    <Box sx={{ px: 1.5, py: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', pb: 1 }}>
        Tema
      </Typography>
      <Stack
        direction="row"
        spacing={0.5}
        sx={(theme) => ({
          borderRadius: '999px',
          bgcolor: listifyElevatedSurface(theme),
          p: 0.5,
        })}
      >
        {THEME_OPTIONS.map((option) => {
          const isActive = theme === option.value;
          const Icon = option.Icon;

          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              aria-pressed={isActive}
              onClick={() => setTheme(option.value)}
              sx={{
                display: 'inline-flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                gap: 0.75,
                border: 0,
                borderRadius: '999px',
                px: 1.5,
                py: 0.75,
                cursor: 'pointer',
                fontSize: '0.875rem',
                fontWeight: 500,
                transition: 'background-color 0.15s, color 0.15s, box-shadow 0.15s',
                ...(isActive
                  ? {
                      bgcolor: 'primary.main',
                      color: '#FFFFFF',
                      boxShadow: (t) => primarySoftShadow(t),
                      '& .MuiSvgIcon-root': { color: 'inherit' },
                    }
                  : {
                      bgcolor: 'transparent',
                      color: 'text.secondary',
                      '&:hover': {
                        bgcolor: 'secondary.main',
                        color: 'text.primary',
                      },
                      '& .MuiSvgIcon-root': { color: 'inherit' },
                    }),
              }}
            >
              <Icon sx={{ fontSize: 16 }} />
              {option.label}
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}
