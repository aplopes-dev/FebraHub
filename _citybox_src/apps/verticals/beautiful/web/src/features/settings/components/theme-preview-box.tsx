'use client';

import { Box, Stack, Typography } from '@citybox/mui/atoms';
import type { ThemePreset } from '@/theme/theme-presets';

type ThemePreviewBoxProps = {
  preset: ThemePreset;
  mode: 'light' | 'dark';
};

export function ThemePreviewBox({ preset, mode }: ThemePreviewBoxProps) {
  const sidebarBg =
    mode === 'dark' ? preset.preview.sidebarBgDark : preset.preview.sidebarBgLight;
  const canvas = mode === 'dark' ? preset.preview.sidebarBgDark : '#FFFFFF';
  const primary = preset.preview.primary;
  const secondary = preset.preview.secondary;
  const textColor = mode === 'dark' ? '#E2E8F0' : '#475569';

  return (
    <Box
      sx={{
        display: 'flex',
        height: 92,
        borderRadius: 1.5,
        overflow: 'hidden',
        border: '1px solid',
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
        bgcolor: canvas,
      }}
    >
      <Box
        sx={{
          width: 28,
          bgcolor: sidebarBg,
          borderRight: '1px solid',
          borderColor: secondary,
          p: 0.75,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
        }}
      >
        <Box sx={{ height: 6, borderRadius: 0.5, bgcolor: primary, opacity: 0.9 }} />
        <Box sx={{ height: 4, borderRadius: 0.5, bgcolor: secondary }} />
        <Box sx={{ height: 4, borderRadius: 0.5, bgcolor: secondary, opacity: 0.7 }} />
      </Box>
      <Stack sx={{ flex: 1, p: 1, gap: 0.75 }}>
        <Box
          sx={{
            height: 18,
            borderRadius: 0.75,
            bgcolor: mode === 'dark' ? 'rgba(255,255,255,0.06)' : secondary,
          }}
        />
        <Box
          sx={{
            alignSelf: 'flex-start',
            px: 1,
            py: 0.25,
            borderRadius: 0.75,
            bgcolor: primary,
            color: '#fff',
          }}
        >
          <Typography sx={{ fontSize: 8, fontWeight: 700, lineHeight: 1.4, color: 'inherit' }}>
            Botão
          </Typography>
        </Box>
        <Box
          sx={{
            alignSelf: 'flex-start',
            px: 0.75,
            py: 0.15,
            borderRadius: 2,
            bgcolor: secondary,
            color: textColor,
          }}
        >
          <Typography sx={{ fontSize: 7, fontWeight: 600, lineHeight: 1.3, color: 'inherit' }}>
            Chip
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}
