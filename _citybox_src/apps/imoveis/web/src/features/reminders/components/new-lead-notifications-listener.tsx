'use client';

import { useEffect, useRef } from 'react';
import { toast } from '@citybox/mui/molecules';
import { useCurrentAgentId } from '@/features/shared/session/hooks/use-current-agent-id';
import { useRemindersQuery } from '@/features/reminders/hooks/use-reminders-query';
import type { ReminderItem } from '@/features/shared/utils/reminder-routes';

const TOASTED_STORAGE_KEY = 'imoveis.new-lead.toast.seen.v1';

function fingerprint(item: ReminderItem): string {
  return `${item.kind}|${item.title}|${item.description}|${item.href ?? ''}`;
}

function readToasted(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(TOASTED_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === 'string'));
  } catch {
    return new Set();
  }
}

function writeToasted(keys: Set<string>): void {
  if (typeof window === 'undefined') return;
  try {
    // Mantém só as últimas 100 chaves para não crescer sem limite.
    const list = [...keys].slice(-100);
    window.localStorage.setItem(TOASTED_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore quota / private mode
  }
}

/**
 * Polling de lembretes + toast quando chega lead novo (site/WhatsApp).
 * Na primeira carga, marca os atuais como já vistos (sem spam de toasts).
 */
export function NewLeadNotificationsListener() {
  const agentId = useCurrentAgentId();
  const { data: reminders = [], isFetched } = useRemindersQuery(
    agentId || undefined,
  );
  const bootstrapped = useRef(false);

  useEffect(() => {
    if (!isFetched) return;

    const inbound = reminders.filter((item) => item.kind === 'new-lead');
    const toasted = readToasted();

    if (!bootstrapped.current) {
      for (const item of inbound) {
        toasted.add(fingerprint(item));
      }
      writeToasted(toasted);
      bootstrapped.current = true;
      return;
    }

    let changed = false;
    for (const item of inbound) {
      const key = fingerprint(item);
      if (toasted.has(key)) continue;
      toasted.add(key);
      changed = true;
      toast.message(item.title, {
        description: item.description,
        duration: 8000,
      });
    }
    if (changed) writeToasted(toasted);
  }, [isFetched, reminders]);

  return null;
}
