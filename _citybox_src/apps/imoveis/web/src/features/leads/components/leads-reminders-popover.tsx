'use client';

import { useState } from 'react';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { Box, Button, Popover, Stack, Typography } from '@citybox/mui/atoms';
import { RemindersPanel } from '@/features/shared/components/reminders-panel';
import { NotificationsPopoverHeader } from '@/features/reminders/components/notifications-popover-header';
import { useReminderReadState } from '@/features/reminders/hooks/use-reminder-read-state';
import { listifyShadows } from '@/theme/tokens';
import type { LeadReminder } from '../types';

type LeadsRemindersPopoverProps = {
  reminders: readonly LeadReminder[];
};

export function LeadsRemindersPopover({ reminders }: LeadsRemindersPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const { unreadCount, unreadReminders } = useReminderReadState(reminders);

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      <Button
        type="button"
        variant="outlined"
        startIcon={<NotificationsOutlinedIcon fontSize="small" />}
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          gap: 1,
          flex: { xs: 1, sm: '0 0 auto' },
          minWidth: 0,
          borderRadius: { xs: '14px', sm: undefined },
          textTransform: 'none',
          fontSize: { xs: '0.8125rem', sm: '0.875rem' },
          whiteSpace: 'nowrap',
        }}
      >
        Notificações
        {unreadCount > 0 ? (
          <Box
            component="span"
            aria-label={`${unreadCount} notificações novas`}
            sx={{
              display: 'inline-flex',
              height: 20,
              minWidth: 20,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 999,
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              px: 0.75,
              fontSize: 10,
              fontWeight: 600,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Box>
        ) : null}
      </Button>
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1,
              width: 'min(100vw - 2rem, 22rem)',
              p: 0,
              borderRadius: '24px',
              border: 1,
              borderColor: 'divider',
              bgcolor: 'background.paper',
              boxShadow: listifyShadows.md,
            },
          },
        }}
      >
        <Stack>
          <NotificationsPopoverHeader onClose={handleClose} />
          <Box sx={{ p: 1 }}>
            {unreadReminders.length === 0 ? (
              <Typography
                color="text.secondary"
                sx={{ px: 1.5, py: 2, fontSize: '0.875rem' }}
              >
                Nenhuma notificação recente.
              </Typography>
            ) : (
              <RemindersPanel
                reminders={reminders}
                variant="embedded"
                onNavigate={handleClose}
              />
            )}
          </Box>
        </Stack>
      </Popover>
    </>
  );
}
