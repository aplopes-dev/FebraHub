'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { useCalendar } from '../contexts/calendar-context';
import { parseLocalDateString } from '../lib/local-date';

/**
 * Deep-link `?date=yyyy-MM-dd` — posiciona o calendário no dia (visão dia)
 * e remove o query param para não prender a data na URL.
 */
export function AgendaDateQueryListener() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const { setSelectedDate, setView } = useCalendar();
  const appliedRef = useRef<string | null>(null);

  useEffect(() => {
    const date = searchParams.get('date');
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
    if (appliedRef.current === date) return;
    appliedRef.current = date;

    setSelectedDate(parseLocalDateString(date));
    setView('day');

    const next = new URLSearchParams(searchParams.toString());
    next.delete('date');
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams, setSelectedDate, setView]);

  return null;
}
