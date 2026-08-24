import type { SxProps, Theme } from '@mui/material/styles';
import { alpha } from '@mui/material/styles';
import { Avatar, Box, Stack, Typography } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';
import type { Person } from '@/features/shared/types';

/** Pares claros (light = superfície, main/dark = texto legível). */
const FALLBACK_TONES_LIGHT = [
  { bgcolor: 'primary.light', color: 'primary.dark' },
  { bgcolor: 'info.light', color: 'info.dark' },
  { bgcolor: 'success.light', color: 'success.dark' },
  { bgcolor: 'warning.light', color: 'warning.dark' },
  { bgcolor: 'error.light', color: 'error.dark' },
] as const;

/**
 * No dark a palette semântica inverte `light`/`main` (superfície profunda).
 * Usar main como texto sobre light (fundo profundo) garante legibilidade.
 */
const FALLBACK_TONES_DARK = [
  { bgcolor: 'primary.dark', color: 'primary.contrastText' },
  { bgcolor: 'info.light', color: 'info.main' },
  { bgcolor: 'success.light', color: 'success.main' },
  { bgcolor: 'warning.light', color: 'warning.main' },
  { bgcolor: 'error.light', color: 'error.main' },
] as const;

function toneFor(id: string, mode: 'light' | 'dark') {
  const tones = mode === 'dark' ? FALLBACK_TONES_DARK : FALLBACK_TONES_LIGHT;
  const seed = [...id].reduce((total, char) => total + char.charCodeAt(0), 0);
  return tones[seed % tones.length];
}

type AvatarGroupProps = {
  people: readonly Person[];
  /** Total real de pessoas — o excedente vira o contador `+n`. */
  total?: number;
  max?: number;
  size?: 'sm' | 'default';
  /** Sem anel de separação (ex.: lembretes com fundo colorido). */
  hideBorder?: boolean;
  className?: string;
  sx?: SxProps<Theme>;
};

export function AvatarGroup({
  people,
  total,
  max = 2,
  size = 'default',
  hideBorder = false,
  className,
  sx,
}: AvatarGroupProps) {
  const visible = people.slice(0, max);
  const remaining = (total ?? people.length) - visible.length;
  const dim = size === 'sm' ? 32 : 36;
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <Stack
      direction="row"
      className={className}
      sx={[
        {
          alignItems: 'center',
          '& > *': { ml: -0.75 },
          '& > *:first-of-type': { ml: 0 },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      {visible.map((person) => {
        return (
          <Avatar
            key={person.id}
            title={person.name}
            sx={(theme) => {
              const tone = toneFor(person.id, theme.palette.mode);
              return {
                width: dim,
                height: dim,
                fontSize,
                fontWeight: 500,
                bgcolor: tone.bgcolor,
                color: tone.color,
                ...(hideBorder
                  ? { border: 'none', boxShadow: 'none' }
                  : { border: `2px solid ${listifyElevatedSurface(theme)}` }),
              };
            }}
          >
            {person.initials}
          </Avatar>
        );
      })}

      {remaining > 0 && (
        <Box
          component="span"
          sx={(theme) => ({
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: dim,
            minWidth: dim,
            px: 1,
            borderRadius: 999,
            bgcolor: listifyElevatedSurface(theme),
            color: 'text.primary',
            fontWeight: 500,
            fontSize,
            ...(hideBorder
              ? { border: 'none', boxShadow: 'none' }
              : {
                  border: `2px solid ${listifyElevatedSurface(theme)}`,
                  boxShadow: `0 0 0 1px ${alpha(theme.palette.divider, 1)}`,
                }),
          })}
        >
          <Typography component="span" sx={{ fontSize: 'inherit', fontWeight: 500 }}>
            +{remaining}
          </Typography>
        </Box>
      )}
    </Stack>
  );
}
