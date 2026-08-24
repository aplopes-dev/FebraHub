import type { ComponentType } from 'react';
import type { SvgIconProps } from '@mui/material/SvgIcon';
import type { SxProps, Theme } from '@mui/material/styles';
import { Box } from '@citybox/mui/atoms';
import { listifyElevatedSurface } from '@/theme/listify-field-styles';

type StatIconBadgeSize = 'sm' | 'md';

const SIZE_MAP: Record<
  StatIconBadgeSize,
  { box: number; icon: number; borderRadius: string }
> = {
  sm: { box: 40, icon: 20, borderRadius: '16px' },
  md: { box: 44, icon: 22, borderRadius: '16px' },
};

/** Superfície neutra para ícones de KPI / estatística — evita cores semânticas por card. */
export function statIconBadgeSx(
  theme: Theme,
  size: StatIconBadgeSize = 'sm',
): SxProps<Theme> {
  const dims = SIZE_MAP[size];
  return {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: dims.box,
    height: dims.box,
    flexShrink: 0,
    borderRadius: dims.borderRadius,
    bgcolor: listifyElevatedSurface(theme),
    color: theme.palette.text.secondary,
    outline: '1px solid',
    outlineColor:
      theme.palette.mode === 'dark'
        ? 'rgba(255, 255, 255, 0.08)'
        : theme.palette.divider,
    outlineOffset: -1,
  };
}

type StatIconBadgeProps = {
  icon: ComponentType<SvgIconProps>;
  size?: StatIconBadgeSize;
  /** Círculo (dashboard) em vez de cantos arredondados. */
  circular?: boolean;
  sx?: SxProps<Theme>;
};

export function StatIconBadge({
  icon: Icon,
  size = 'sm',
  circular = false,
  sx,
}: StatIconBadgeProps) {
  const dims = SIZE_MAP[size];

  return (
    <Box
      sx={(theme) => ({
        ...(statIconBadgeSx(theme, size) as object),
        ...(circular ? { borderRadius: '999px' } : {}),
        ...(typeof sx === 'function' ? (sx(theme) as object) : (sx as object)),
      })}
    >
      <Icon sx={{ fontSize: dims.icon }} />
    </Box>
  );
}
