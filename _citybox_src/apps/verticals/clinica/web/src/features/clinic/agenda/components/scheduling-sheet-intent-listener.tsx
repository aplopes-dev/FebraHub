'use client';

import { useEffect } from 'react';

import { useSchedulingSheet } from '../contexts/scheduling-sheet-context';
import { consumeSchedulingSheetIntent } from '../lib/scheduling-sheet-intent';

/**
 * Abre o sheet de agendamento quando a navegação veio de outra rota
 * (ex.: ficha do paciente → Agendar no alerta de retorno).
 */
export function SchedulingSheetIntentListener() {
  const { openSheet } = useSchedulingSheet();

  useEffect(() => {
    const intent = consumeSchedulingSheetIntent();
    if (!intent) return;

    const observation =
      intent.observation ??
      (typeof intent.observations === 'string' ? intent.observations : undefined);

    openSheet(
      {
        ...intent,
        observation,
      },
      'create',
    );
  }, [openSheet]);

  return null;
}
