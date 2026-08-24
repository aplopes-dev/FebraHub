'use client';

import CloseIcon from '@mui/icons-material/Close';
import { IconButton, Stack, Typography } from '@citybox/mui/atoms';

type NotificationsPopoverHeaderProps = {
  onClose: () => void;
};

export function NotificationsPopoverHeader({
  onClose,
}: NotificationsPopoverHeaderProps) {
  return (
    <Stack
      direction="row"
      spacing={1}
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: 1,
        borderColor: 'divider',
        px: 2,
        py: 1.25,
        gap: 1,
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, minWidth: 0 }}>
        Notificações
      </Typography>
      <IconButton
        type="button"
        size="small"
        aria-label="Fechar notificações"
        onClick={onClose}
        sx={{
          width: 32,
          height: 32,
          flexShrink: 0,
          color: 'text.secondary',
          '&:hover': { bgcolor: 'secondary.main', color: 'text.primary' },
        }}
      >
        <CloseIcon sx={{ fontSize: 18 }} />
      </IconButton>
    </Stack>
  );
}
