'use client';

import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export type AuthStatusVariant = 'loading' | 'success' | 'warning' | 'error';

type AuthStatusPanelProps = {
  variant: AuthStatusVariant;
  message: string;
};

const severityMap: Record<
  Exclude<AuthStatusVariant, 'loading'>,
  'success' | 'warning' | 'error'
> = {
  success: 'success',
  warning: 'warning',
  error: 'error',
};

export function AuthStatusPanel({ variant, message }: AuthStatusPanelProps) {
  if (variant === 'loading') {
    return (
      <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          {message}
        </Typography>
      </Stack>
    );
  }

  return (
    <Alert severity={severityMap[variant]} sx={{ width: '100%' }}>
      {message}
    </Alert>
  );
}
