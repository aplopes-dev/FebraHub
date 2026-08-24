'use client';

import { Box, Typography } from '@citybox/mui/atoms';
import { NEUTRAL_STATUS_BADGE_SX } from '@/components/ui/status-badge';
import { LEAD_STATUS_LABEL, type LeadStatus } from '../types';

export function LeadStatusBadge({
  status,
  className,
}: {
  status: LeadStatus;
  className?: string;
}) {
  return (
    <Box
      component="span"
      className={className}
      sx={{
        display: 'inline-flex',
        maxWidth: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 999,
        px: 1.5,
        py: 0.5,
        gap: 1,
        ...NEUTRAL_STATUS_BADGE_SX,
        whiteSpace: 'nowrap',
      }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: '0.875rem',
          fontWeight: 500,
          lineHeight: 1.55,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {LEAD_STATUS_LABEL[status]}
      </Typography>
    </Box>
  );
}
