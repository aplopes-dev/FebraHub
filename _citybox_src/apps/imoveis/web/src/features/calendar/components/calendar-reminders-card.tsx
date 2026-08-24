'use client';

import {
  REMINDERS_CARD_VISIBLE_LIMIT,
  RemindersPanel,
} from '@/features/shared/components/reminders-panel';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useLeadsReminders } from '@/features/reminders/hooks/use-reminders-query';

/** Card de lembretes da agenda — mesma fonte que header/leads (`GET /v1/reminders`). */
export function CalendarRemindersCard() {
  const agentId = useCurrentAgentId();
  const { reminders } = useLeadsReminders(agentId);
  return (
    <RemindersPanel
      reminders={reminders}
      density="compact"
      maxVisible={REMINDERS_CARD_VISIBLE_LIMIT}
    />
  );
}
