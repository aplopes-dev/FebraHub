'use client';

import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Input, Popover, Stack, Typography } from '@citybox/mui/atoms';
import { normalizeAccentHex, type CustomAccentHex } from '../data/accent-presets';
import {
  hexToHsv,
  hsvToHex,
  hueToHex,
  type HsvColor,
} from '../utils/color-spectrum-utils';
import {
  listifyElevatedSurfaceStyles,
  listifyPageFieldSx,
} from '@/theme/listify-field-styles';
import { listifyShadows } from '@/theme/tokens';

type AccentColorSpectrumPopoverProps = {
  open: boolean;
  anchorEl: HTMLElement | null;
  value: string;
  onClose: () => void;
  onChange: (hex: CustomAccentHex) => void;
};

const HUE_GRADIENT =
  'linear-gradient(90deg, #FF0000 0%, #FFFF00 17%, #00FF00 33%, #00FFFF 50%, #0000FF 67%, #FF00FF 83%, #FF0000 100%)';

const popoverPaperSx: SxProps<Theme> = (theme) => ({
  width: 280,
  p: 2,
  borderRadius: '16px',
  ...listifyElevatedSurfaceStyles(theme),
  boxShadow: theme.palette.mode === 'dark' ? listifyShadows.lg : listifyShadows.md,
  backgroundImage: 'none',
});

const pickerThumbSx: SxProps<Theme> = {
  position: 'absolute',
  width: 14,
  height: 14,
  borderRadius: '999px',
  border: '2px solid #fff',
  boxShadow: '0 0 0 1px rgba(0,0,0,0.25)',
  transform: 'translate(-50%, -50%)',
  pointerEvents: 'none',
};

function resolveInitialHsv(value: string): HsvColor {
  return hexToHsv(value) ?? { h: 28, s: 1, v: 1 };
}

export function AccentColorSpectrumPopover({
  open,
  anchorEl,
  value,
  onClose,
  onChange,
}: AccentColorSpectrumPopoverProps) {
  const svRef = useRef<HTMLDivElement>(null);
  const hueRef = useRef<HTMLDivElement>(null);
  const [hsv, setHsv] = useState<HsvColor>(() => resolveInitialHsv(value));
  const [hexDraft, setHexDraft] = useState(value);
  const hsvRef = useRef(hsv);

  useEffect(() => {
    hsvRef.current = hsv;
  }, [hsv]);

  useEffect(() => {
    if (!open) return;
    const next = resolveInitialHsv(value);
    hsvRef.current = next;
    setHsv(next);
    setHexDraft(value);
  }, [open, value]);

  const emitHex = useCallback(
    (nextHsv: HsvColor) => {
      const hex = hsvToHex(nextHsv) as CustomAccentHex;
      setHexDraft(hex);
      onChange(hex);
    },
    [onChange],
  );

  const updateHsv = useCallback(
    (patch: Partial<HsvColor>) => {
      const next = { ...hsvRef.current, ...patch };
      hsvRef.current = next;
      setHsv(next);
      emitHex(next);
    },
    [emitHex],
  );

  const handleSvPointer = useCallback(
    (clientX: number, clientY: number) => {
      const node = svRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const s = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height));
      updateHsv({ s, v });
    },
    [updateHsv],
  );

  const handleHuePointer = useCallback(
    (clientX: number) => {
      const node = hueRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      updateHsv({ h: ratio * 360 });
    },
    [updateHsv],
  );

  const bindDrag = useCallback(
    (move: (x: number, y: number) => void) => (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const target = event.currentTarget;
      target.setPointerCapture(event.pointerId);
      move(event.clientX, event.clientY);

      const onMove = (moveEvent: globalThis.PointerEvent) => {
        move(moveEvent.clientX, moveEvent.clientY);
      };
      const onUp = () => {
        target.releasePointerCapture(event.pointerId);
        target.removeEventListener('pointermove', onMove);
        target.removeEventListener('pointerup', onUp);
        target.removeEventListener('pointercancel', onUp);
      };

      target.addEventListener('pointermove', onMove);
      target.addEventListener('pointerup', onUp);
      target.addEventListener('pointercancel', onUp);
    },
    [],
  );

  const currentHex = hsvToHex(hsv);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      transformOrigin={{ vertical: 'top', horizontal: 'left' }}
      slotProps={{
        paper: { sx: popoverPaperSx },
      }}
    >
      <Stack spacing={1.5}>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
          Espectro de cor
        </Typography>

        <Box
          ref={svRef}
          role="slider"
          aria-label="Saturação e brilho"
          aria-valuetext={currentHex}
          onPointerDown={bindDrag((x, y) => handleSvPointer(x, y))}
          sx={{
            position: 'relative',
            height: 140,
            borderRadius: '12px',
            overflow: 'hidden',
            cursor: 'crosshair',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              bgcolor: hueToHex(hsv.h),
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(90deg, #FFFFFF 0%, transparent 100%)',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(0deg, #000000 0%, transparent 100%)',
            }}
          />
          <Box
            sx={{
              ...pickerThumbSx,
              left: `${hsv.s * 100}%`,
              top: `${(1 - hsv.v) * 100}%`,
            }}
          />
        </Box>

        <Box
          ref={hueRef}
          role="slider"
          aria-label="Matiz"
          aria-valuenow={Math.round(hsv.h)}
          aria-valuemin={0}
          aria-valuemax={360}
          onPointerDown={bindDrag((x) => handleHuePointer(x))}
          sx={{
            position: 'relative',
            height: 12,
            borderRadius: '999px',
            background: HUE_GRADIENT,
            cursor: 'pointer',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          <Box
            sx={{
              ...pickerThumbSx,
              top: '50%',
              left: `${(hsv.h / 360) * 100}%`,
            }}
          />
        </Box>

        <Stack direction="row" spacing={1.25} sx={{ alignItems: 'center' }}>
          <Box
            aria-hidden
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '999px',
              bgcolor: currentHex,
              border: '2px solid',
              borderColor: 'background.paper',
              boxShadow: '0 0 0 1px rgba(0,0,0,0.08)',
            }}
          />
          <Input
            value={hexDraft}
            aria-label="Código hex"
            onChange={(event) => {
              const next = event.target.value.toUpperCase();
              setHexDraft(next);
              const normalized = normalizeAccentHex(next);
              if (!normalized) return;
              const nextHsv = hexToHsv(normalized);
              if (!nextHsv) return;
              setHsv(nextHsv);
              onChange(normalized);
            }}
            onBlur={() => {
              const normalized = normalizeAccentHex(hexDraft);
              if (normalized) {
                setHexDraft(normalized);
                return;
              }
              setHexDraft(currentHex);
            }}
            slotProps={{
              htmlInput: { maxLength: 7, spellCheck: false },
            }}
            sx={(theme) => ({
              ...(typeof listifyPageFieldSx === 'function'
                ? (listifyPageFieldSx(theme) as object)
                : listifyPageFieldSx),
              flex: 1,
              '& .MuiOutlinedInput-root': {
                height: 40,
                minHeight: 40,
                borderRadius: '10px',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
              },
            })}
          />
        </Stack>
      </Stack>
    </Popover>
  );
}
