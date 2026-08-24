import type { SxProps, Theme } from '@mui/material/styles';
import { Box, Typography } from '@citybox/mui/atoms';
import type { Property } from '@/features/shared/types';
import { PROPERTY_STATUS_LABEL } from '@/features/shared/types';
import { listifyNeutralBadgeSx } from '@/theme/listify-field-styles';

/** Tom neutro único — status não usa cor semântica. */
export const NEUTRAL_STATUS_BADGE_SX: SxProps<Theme> = listifyNeutralBadgeSx;

type PropertyStatusBadgeProps = {
  status: Property['status'];
  /** Unidades ocupadas — vira `8/12 Ocupado` quando informado. */
  occupiedUnits?: number;
  units?: number;
  className?: string;
  sx?: SxProps<Theme>;
};

export function PropertyStatusBadge({
  status,
  occupiedUnits,
  units,
  className,
  sx,
}: PropertyStatusBadgeProps) {
  const hasOccupancy =
    occupiedUnits !== undefined &&
    units !== undefined &&
    occupiedUnits > 0 &&
    (status === 'occupied' || status === 'available' || status === 'reserved');
  const label = hasOccupancy
    ? `${occupiedUnits}/${units} ${PROPERTY_STATUS_LABEL[status === 'available' ? 'occupied' : status]}`
    : PROPERTY_STATUS_LABEL[status];

  return (
    <Box
      component="span"
      className={className}
      sx={[
        {
          display: 'inline-flex',
          maxWidth: '100%',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: 999,
          px: 1.5,
          py: 0.5,
          whiteSpace: 'nowrap',
        },
        NEUTRAL_STATUS_BADGE_SX,
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Typography
        component="span"
        sx={{ fontSize: '0.75rem', fontWeight: 500, lineHeight: 1.55 }}
      >
        {label}
      </Typography>
    </Box>
  );
}
