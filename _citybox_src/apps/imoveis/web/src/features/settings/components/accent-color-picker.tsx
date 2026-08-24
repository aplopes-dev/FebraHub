'use client';

import { useRef, useState } from 'react';
import CheckIcon from '@mui/icons-material/Check';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Input, Stack, Typography } from '@citybox/mui/atoms';
import {
  ACCENT_COLOR_PRESETS,
  getAccentColorPreset,
  isAccentColorId,
  isCustomAccentHex,
  normalizeAccentHex,
  type AccentColorValue,
} from '../data/accent-presets';
import { AccentColorSpectrumPopover } from './accent-color-spectrum-popover';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

type AccentColorPickerProps = {
  value: AccentColorValue;
  onChange: (value: AccentColorValue) => void;
};

const RAINBOW_SWATCH_GRADIENT =
  'conic-gradient(from 135deg, #FF0000 0deg, #FFFF00 60deg, #00FF00 120deg, #00FFFF 180deg, #0000FF 240deg, #FF00FF 300deg, #FF0000 360deg)';

const SWATCH_SIZE = { xs: 32, sm: 36 } as const;

const swatchButtonResetSx: SxProps<Theme> = {
  appearance: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  m: 0,
  minWidth: 0,
  fontSize: 0,
  lineHeight: 0,
  WebkitTapHighlightColor: 'transparent',
};

const customSwatchSx = (selected: boolean): SxProps<Theme> => (theme) => ({
  ...swatchButtonResetSx,
  position: 'relative',
  width: SWATCH_SIZE,
  height: SWATCH_SIZE,
  flexShrink: 0,
  borderRadius: '999px',
  overflow: 'hidden',
  cursor: 'pointer',
  p: 0,
  background: RAINBOW_SWATCH_GRADIENT,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  border: '2px solid',
  borderColor: selected ? theme.palette.primary.main : 'transparent',
  boxShadow: selected
    ? `0 0 0 2px ${theme.palette.primary.main}40`
    : '0 1px 2px rgba(16, 24, 40, 0.08)',
  outline: '1px solid',
  outlineColor:
    theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.12)'
      : 'rgba(255, 255, 255, 0.65)',
  outlineOffset: -1,
  '&:hover': { transform: 'scale(1.06)' },
});

function resolveDisplayColor(value: AccentColorValue): string {
  if (isCustomAccentHex(value)) return value;
  return getAccentColorPreset(value).swatch;
}

function resolveSelectionLabel(value: AccentColorValue): string {
  if (isCustomAccentHex(value)) return `Personalizada (${value})`;
  return getAccentColorPreset(value).label;
}

const presetSwatchSx = (selected: boolean): SxProps<Theme> => ({
  ...swatchButtonResetSx,
  position: 'relative',
  width: SWATCH_SIZE,
  height: SWATCH_SIZE,
  flexShrink: 0,
  borderRadius: '999px',
  border: '2px solid',
  borderColor: selected ? 'primary.main' : 'transparent',
  boxShadow: selected
    ? (theme) => `0 0 0 2px ${theme.palette.primary.main}40`
    : 'none',
  cursor: 'pointer',
  p: 0,
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
  '&:hover': { transform: 'scale(1.06)' },
});

const selectedOverlaySx: SxProps<Theme> = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 'inherit',
  bgcolor: 'rgba(0,0,0,0.22)',
  color: '#fff',
  pointerEvents: 'none',
};

export function AccentColorPicker({ value, onChange }: AccentColorPickerProps) {
  const customActive = isCustomAccentHex(value);
  const customButtonRef = useRef<HTMLButtonElement>(null);
  const [spectrumOpen, setSpectrumOpen] = useState(false);
  const [hexDraft, setHexDraft] = useState(customActive ? value : '');

  function selectPreset(id: (typeof ACCENT_COLOR_PRESETS)[number]['id']) {
    onChange(id);
    setHexDraft('');
    setSpectrumOpen(false);
  }

  function selectCustom(hex: string) {
    const normalized = normalizeAccentHex(hex);
    if (!normalized) return;
    onChange(normalized);
    setHexDraft(normalized);
  }

  function openSpectrum() {
    if (!customActive) {
      selectCustom('#FF8415');
    }
    setSpectrumOpen(true);
  }

  return (
    <Stack spacing={1.5}>
      <Stack
        direction="row"
        sx={{
          flexWrap: 'nowrap',
          alignItems: 'center',
          // Mobile: ocupa a linha. Desktop: grupo compacto à esquerda (não espalha).
          justifyContent: { xs: 'space-between', sm: 'flex-start' },
          width: { xs: '100%', sm: 'auto' },
          minWidth: 0,
          columnGap: { xs: 0.75, sm: 1 },
          overflowX: { xs: 'auto', sm: 'visible' },
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          '&::-webkit-scrollbar': { display: 'none' },
        }}
        role="group"
        aria-label="Cores de destaque"
      >
        {ACCENT_COLOR_PRESETS.map((preset) => {
          const selected = isAccentColorId(value) && value === preset.id;
          return (
            <Box
              key={preset.id}
              component="button"
              type="button"
              aria-label={preset.label}
              aria-pressed={selected}
              title={preset.label}
              onClick={() => selectPreset(preset.id)}
              sx={{
                ...presetSwatchSx(selected),
                bgcolor: preset.swatch,
              }}
            >
              {selected ? (
                <Box sx={selectedOverlaySx}>
                  <CheckIcon sx={{ fontSize: 18 }} />
                </Box>
              ) : null}
            </Box>
          );
        })}

        <Box
          ref={customButtonRef}
          component="button"
          type="button"
          aria-label="Cor personalizada"
          aria-pressed={customActive}
          aria-expanded={spectrumOpen}
          title="Escolher cor personalizada"
          onClick={openSpectrum}
          sx={customSwatchSx(customActive)}
        >
          {customActive ? (
            <Box sx={selectedOverlaySx}>
              <CheckIcon sx={{ fontSize: 18 }} />
            </Box>
          ) : null}
        </Box>

        <AccentColorSpectrumPopover
          open={spectrumOpen}
          anchorEl={customButtonRef.current}
          value={customActive ? value : '#FF8415'}
          onClose={() => setSpectrumOpen(false)}
          onChange={selectCustom}
        />
      </Stack>

      <Stack
        direction="row"
        spacing={1.5}
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'nowrap',
          borderRadius: '12px',
          bgcolor: (theme) => listifyElevatedSurface(theme),
          px: 1.5,
          py: 1.25,
        }}
      >
        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center', minWidth: 0 }}>
          <Box
            aria-hidden
            sx={{
              width: 28,
              height: 28,
              flexShrink: 0,
              borderRadius: '999px',
              bgcolor: resolveDisplayColor(value),
              border: '2px solid',
              borderColor: 'background.paper',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
            }}
          />
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Selecionada
            </Typography>
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {resolveSelectionLabel(value)}
            </Typography>
          </Box>
        </Stack>

        {customActive ? (
          <Input
            value={hexDraft || value}
            placeholder="#FF8415"
            aria-label="Código hex da cor personalizada"
            onChange={(event) => {
              const next = event.target.value;
              setHexDraft(next.toUpperCase());
              const normalized = normalizeAccentHex(next);
              if (normalized) onChange(normalized);
            }}
            onBlur={() => {
              const normalized = normalizeAccentHex(hexDraft);
              if (normalized) {
                onChange(normalized);
                return;
              }
              setHexDraft(value);
            }}
            slotProps={{
              htmlInput: { maxLength: 7, spellCheck: false },
            }}
            sx={{
              width: { xs: 112, sm: 132 },
              flexShrink: 0,
              '& .MuiOutlinedInput-root': {
                height: 40,
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                bgcolor: 'background.paper',
              },
            }}
          />
        ) : null}
      </Stack>
    </Stack>
  );
}
