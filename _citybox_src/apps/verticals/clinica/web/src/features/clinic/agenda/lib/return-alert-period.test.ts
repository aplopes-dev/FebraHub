import { describe, expect, it } from 'vitest';

import {
  formatReturnAlertPeriodLabel,
  resolveReturnAlertPeriod,
} from './return-alert-period';

describe('resolveReturnAlertPeriod', () => {
  const mondayAug3 = new Date(2026, 7, 3);

  it('usa a semana inteira (seg–dom) na visão dia', () => {
    const period = resolveReturnAlertPeriod('day', mondayAug3);

    expect(period.periodKind).toBe('week');
    expect(period.startDate).toBe('2026-08-03');
    expect(period.endDate).toBe('2026-08-09');
  });

  it('usa a semana inteira na visão semana', () => {
    const period = resolveReturnAlertPeriod('week', mondayAug3);

    expect(period.startDate).toBe('2026-08-03');
    expect(period.endDate).toBe('2026-08-09');
  });

  it('inclui retornos de quinta e sexta ao navegar na segunda da mesma semana', () => {
    const period = resolveReturnAlertPeriod('day', mondayAug3);
    const thursday = '2026-08-07';
    const friday = '2026-08-08';

    expect(thursday >= period.startDate && thursday <= period.endDate).toBe(true);
    expect(friday >= period.startDate && friday <= period.endDate).toBe(true);
  });

  it('formata rótulo semanal', () => {
    const period = resolveReturnAlertPeriod('week', mondayAug3);
    expect(formatReturnAlertPeriodLabel(period)).toBe(
      'para a semana de 03/08 a 09/08',
    );
  });
});
