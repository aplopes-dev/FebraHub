'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Stack,
  Switch,
  Typography,
} from '@citybox/mui/atoms';
import { Icon } from '@citybox/mui/icons';
import { ThemePreviewBox } from '@/features/settings/components/theme-preview-box';
import type { ThemePreset } from '@/theme/theme-presets';
import { settingsMutedTextSx } from '@/features/settings/lib/settings-muted';

type ThemePresetCardProps = {
  preset: ThemePreset;
  active: boolean;
  disabled: boolean;
  defaultPreviewDark: boolean;
  onSelect: () => void;
};

export function ThemePresetCard({
  preset,
  active,
  disabled,
  defaultPreviewDark,
  onSelect,
}: ThemePresetCardProps) {
  const [previewDark, setPreviewDark] = useState(defaultPreviewDark);

  return (
    <Card
      elevation={0}
      onClick={() => {
        if (!disabled) onSelect();
      }}
      sx={{
        height: '100%',
        cursor: disabled ? 'default' : 'pointer',
        border: '2px solid',
        borderColor: active ? 'primary.main' : 'divider',
        boxShadow: active
          ? (theme) => `0 0 0 1px ${theme.palette.primary.main}`
          : 'none',
        bgcolor: 'background.paper',
      }}
    >
      <CardContent sx={{ p: 2, height: '100%' }}>
        <Stack spacing={1.5}>
          <Stack
            direction="row"
            spacing={1}
            sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                {preset.name}
              </Typography>
              <Typography variant="caption" sx={{ ...settingsMutedTextSx, display: 'block', mt: 0.25 }}>
                {preset.category}
              </Typography>
            </Box>
            {active ? (
              <Stack
                direction="row"
                spacing={0.5}
                sx={{
                  px: 1,
                  py: 0.25,
                  borderRadius: 5,
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  flexShrink: 0,
                  alignItems: 'center',
                }}
              >
                <Icon name="check" size={14} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'inherit' }}>
                  Ativo
                </Typography>
              </Stack>
            ) : null}
          </Stack>

          <Stack direction="row" spacing={0.75}>
            {[preset.preview.primary, preset.preview.secondary, preset.preview.sidebarBgDark].map(
              (color) => (
                <Box
                  key={color}
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    bgcolor: color,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                />
              ),
            )}
          </Stack>

          <ThemePreviewBox preset={preset} mode={previewDark ? 'dark' : 'light'} />

          <Typography variant="body2" sx={settingsMutedTextSx}>
            {preset.description}
          </Typography>

          <Stack
            direction="row"
            sx={{ alignItems: 'center', justifyContent: 'space-between' }}
            onClick={(event) => event.stopPropagation()}
          >
            <Typography variant="caption" sx={settingsMutedTextSx}>
              Visualizar em modo escuro
            </Typography>
            <Switch
              size="small"
              checked={previewDark}
              onChange={(_, checked) => setPreviewDark(checked)}
              slotProps={{
                input: {
                  'aria-label': `Pré-visualizar ${preset.name} no modo escuro`,
                },
              }}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
