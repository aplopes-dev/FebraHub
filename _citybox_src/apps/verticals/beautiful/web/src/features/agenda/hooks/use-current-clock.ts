'use client';

import { useEffect, useState } from 'react';

/** Relógio local atualizado a cada minuto — mesmo intervalo da agenda da Clínica. */
export function useCurrentClock(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
