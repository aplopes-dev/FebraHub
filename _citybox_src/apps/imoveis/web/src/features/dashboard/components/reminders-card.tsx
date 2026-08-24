'use client';

import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import {
  REMINDERS_CARD_VISIBLE_LIMIT,
  RemindersPanel,
} from '@/features/shared/components/reminders-panel';
import type { Reminder } from '../types';

export function RemindersCard({ reminders }: { reminders: readonly Reminder[] }) {
  const theme = useTheme();
  const isSidebar = useMediaQuery(theme.breakpoints.up('xl'));

  return (
    <RemindersPanel
      reminders={reminders}
      density={isSidebar ? 'default' : 'compact'}
      maxVisible={REMINDERS_CARD_VISIBLE_LIMIT}
    />
  );
}
