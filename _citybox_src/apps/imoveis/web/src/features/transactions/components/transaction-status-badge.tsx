import { Box, Typography } from '@citybox/mui/atoms';
import { NEUTRAL_STATUS_BADGE_SX } from '@/components/ui/status-badge';
import {
  TRANSACTION_STATUS_LABEL,
  type TransactionStatus,
} from '../types';

export function TransactionStatusBadge({ status }: { status: TransactionStatus }) {
  return (
    <Box
      component="span"
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        px: 1.5,
        py: 0.5,
        ...NEUTRAL_STATUS_BADGE_SX,
      }}
    >
      <Typography component="span" sx={{ fontSize: 12, fontWeight: 500 }}>
        {TRANSACTION_STATUS_LABEL[status]}
      </Typography>
    </Box>
  );
}
