'use client';

import { useEffect, useState } from 'react';
import { formatSystemDateTime } from '../utils/format-system-datetime';

/** Relógio ao vivo no fuso informado — só após mount (evita mismatch SSR). */
export function useSystemClock(timezone: string): string {
  const [label, setLabel] = useState('');

  useEffect(() => {
    function tick() {
      setLabel(formatSystemDateTime(timezone, new Date()));
    }
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [timezone]);

  return label;
}
