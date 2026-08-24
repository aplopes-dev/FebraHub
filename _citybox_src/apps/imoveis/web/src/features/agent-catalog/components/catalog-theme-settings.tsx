'use client';

import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { useState } from 'react';
import { Box, IconButton, Popover, Stack, Typography } from '@citybox/mui/atoms';
import { useTheme, type ColorMode } from '@/lib/color-mode';
import { primarySoftShadow } from '@/theme/accent-styles';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import { catalogHeaderIconButtonSx } from '../utils/catalog-chrome-styles';

const THEME_OPTIONS = [
  { value: 'light' as const, label: 'Claro', Icon: LightModeOutlinedIcon },
  { value: 'dark' as const, label: 'Escuro', Icon: DarkModeOutlinedIcon },
] as const;

/**
 * Preferências só do catálogo público (tema claro/escuro).
 * Persistido em `imoveis.catalog.theme` — não altera o painel.
 */
export function CatalogThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        type="button"
        aria-label="Configurações do catálogo"
        aria-haspopup="true"
        aria-expanded={open}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={catalogHeaderIconButtonSx}
      >
        <SettingsOutlinedIcon sx={{ fontSize: 20 }} aria-hidden />
      </IconButton>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: '16px',
              border: 'none',
              bgcolor: 'background.paper',
              boxShadow: '0 4px 12px rgba(16, 24, 40, 0.08)',
            },
          },
        }}
      >
        <Box sx={{ px: 1.5, py: 1.5 }}>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', pb: 1, px: 0.5 }}
          >
            Tema do catálogo
          </Typography>
          <Stack
            direction="row"
            spacing={0.5}
            sx={(muiTheme) => ({
              borderRadius: '999px',
              bgcolor: listifyElevatedSurface(muiTheme),
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
                  onClick={() => setTheme(option.value as ColorMode)}
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
                          color: 'primary.contrastText',
                          boxShadow: (t) => primarySoftShadow(t),
                          '& .MuiSvgIcon-root': { color: 'inherit' },
                        }
                      : {
                          bgcolor: 'transparent',
                          color: 'text.secondary',
                          '&:hover': { color: 'text.primary' },
                        }),
                  }}
                >
                  <Icon sx={{ fontSize: 18 }} />
                  {option.label}
                </Box>
              );
            })}
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
