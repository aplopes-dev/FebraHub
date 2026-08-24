'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import type { ReminderItem } from '@/features/shared/utils/reminder-routes';
import {
  getRemindersReadVersion,
  isReminderRead,
  markReminderRead,
  markRemindersRead,
  subscribeRemindersRead,
  type ReminderReadFingerprintInput,
} from '../data/read-reminders-store';

function toFingerprint(item: ReminderItem): ReminderReadFingerprintInput {
  return {
    kind: item.kind,
    title: item.title,
    description: item.description,
    totalPeople: item.totalPeople,
    href: item.href,
  };
}

/** Mais recentes / acionáveis primeiro no inbox de notificações. */
export function sortNotifications(
  items: readonly ReminderItem[],
): ReminderItem[] {
  const rank = (kind: ReminderItem['kind']): number => {
    if (kind === 'new-lead') return 0;
    if (kind === 'follow-up') return 1;
    if (kind === 'visit') return 2;
    if (kind === 'signing') return 3;
    return 4;
  };
  return [...items].sort((a, b) => {
    const byKind = rank(a.kind) - rank(b.kind);
    if (byKind !== 0) return byKind;
    return a.description.localeCompare(b.description, 'pt-BR');
  });
}

export function useReminderReadState(reminders: readonly ReminderItem[]) {
  const version = useSyncExternalStore(
    subscribeRemindersRead,
    getRemindersReadVersion,
    () => 0,
  );

  const unreadReminders = useMemo(() => {
    void version;
    return sortNotifications(
      reminders.filter((item) => !isReminderRead(toFingerprint(item))),
    );
  }, [reminders, version]);

  const unreadCount = unreadReminders.length;

  const isRead = useCallback(
    (item: ReminderItem) => {
      void version;
      return isReminderRead(toFingerprint(item));
    },
    [version],
  );

  const markRead = useCallback((item: ReminderItem) => {
    markReminderRead(toFingerprint(item));
  }, []);

  const markAllRead = useCallback(() => {
    markRemindersRead(unreadReminders.map(toFingerprint));
  }, [unreadReminders]);

  return { unreadCount, unreadReminders, isRead, markRead, markAllRead };
}
