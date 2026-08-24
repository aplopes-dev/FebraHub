import { describe, expect, it } from 'vitest';
import { formatLocalDateString, parseLocalDateString } from './local-date';

describe('local-date', () => {
  it('parseLocalDateString mantém o dia do calendário em fuso local', () => {
    const date = parseLocalDateString('2026-07-08');
    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(6);
    expect(date.getDate()).toBe(8);
  });

  it('formatLocalDateString e parseLocalDateString são inversos', () => {
    const original = '2026-07-08';
    expect(formatLocalDateString(parseLocalDateString(original))).toBe(original);
  });
});
