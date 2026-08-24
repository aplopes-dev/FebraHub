'use client';

import { useState, type MouseEvent, type ReactNode } from 'react';
import { Box, Popover, Stack, Typography } from '@citybox/mui/atoms';
import { RemindersPanel } from '@/features/shared/components/reminders-panel';
import { NotificationsPopoverHeader } from '@/features/reminders/components/notifications-popover-header';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useLeadsReminders } from '@/features/leads/hooks/use-leads-reminders';
import { useReminderReadState } from '@/features/reminders/hooks/use-reminder-read-state';
import { listifyShadows } from '@/theme/tokens';

type HeaderRemindersPopoverProps = {
  children: (props: {
    onClick: (event: MouseEvent<HTMLElement>) => void;
    badge: number;
    open: boolean;
  }) => ReactNode;
};

export function HeaderRemindersPopover({
  children,
}: HeaderRemindersPopoverProps) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);
  const agentId = useCurrentAgentId();
  const { reminders } = useLeadsReminders(agentId);
  const { unreadCount, unreadReminders } = useReminderReadState(reminders);

  function handleClose() {
    setAnchorEl(null);
  }

  return (
    <>
      {children({
        onClick: (event) => setAnchorEl(event.currentTarget),
        badge: unreadCount,
        open,
      })}
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
