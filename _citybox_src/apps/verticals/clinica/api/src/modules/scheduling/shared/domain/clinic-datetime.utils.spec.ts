import {
  getClinicWallClockParts,
  parseClinicDateTime,
  rebaseLegacySchedulingInstant,
  toClinicWallClockUtc,
} from './clinic-datetime.utils';

describe('parseClinicDateTime', () => {
  it('interpreta datetime sem offset como wall-clock UTC da clínica', () => {
    expect(parseClinicDateTime('2026-07-09T08:00:00').toISOString()).toBe(
      '2026-07-09T08:00:00.000Z',
    );
    expect(parseClinicDateTime('2026-07-09T11:00:00').toISOString()).toBe(
      '2026-07-09T11:00:00.000Z',
    );
  });

  it('aceita HH:mm sem segundos', () => {
    expect(parseClinicDateTime('2026-07-09T08:00').toISOString()).toBe(
      '2026-07-09T08:00:00.000Z',
    );
  });

  it('preserva strings já com Z', () => {
    expect(parseClinicDateTime('2026-07-09T08:00:00.000Z').toISOString()).toBe(
      '2026-07-09T08:00:00.000Z',
    );
  });

  it('converte date-only para meia-noite UTC', () => {
    expect(parseClinicDateTime('2026-07-09').toISOString()).toBe(
      '2026-07-09T00:00:00.000Z',
    );
  });
});

describe('getClinicWallClockParts', () => {
  it('extrai data e minutos no fuso America/Sao_Paulo', () => {
    // 16:05 BRT = 19:05 UTC
    const parts = getClinicWallClockParts(
      new Date('2026-07-06T19:05:00.000Z'),
    );
    expect(parts.date).toBe('2026-07-06');
    expect(parts.minutes).toBe(16 * 60 + 5);
  });
});

describe('toClinicWallClockUtc', () => {
  it('projeta instante real para wall-clock-as-UTC da clínica', () => {
    // 10:24 BRT = 13:24 UTC → wall-clock 10:24Z
    expect(
      toClinicWallClockUtc(new Date('2026-08-06T13:24:00.000Z')).toISOString(),
    ).toBe('2026-08-06T10:24:00.000Z');
  });

  it('alinha 11:30 BRT (14:30 UTC) com startAt wall-clock 11:30Z', () => {
    expect(
      toClinicWallClockUtc(new Date('2026-08-06T14:30:00.000Z')).toISOString(),
    ).toBe('2026-08-06T11:30:00.000Z');
  });
});

describe('rebaseLegacySchedulingInstant', () => {
  const legacyCreated = new Date('2026-07-08T19:40:00.000Z');
  const legacyUpdated = new Date('2026-07-08T19:40:00.000Z');

  it('subtrai 3h de compromisso legado com horário', () => {
    const stored = new Date('2026-07-09T11:00:00.000Z');
    const rebased = rebaseLegacySchedulingInstant(
      stored,
      legacyCreated,
      legacyUpdated,
      { allDay: false, mode: 'start' },
    );
    expect(rebased.toISOString()).toBe('2026-07-09T08:00:00.000Z');
  });

  it('não altera registro criado após o cutoff', () => {
    const stored = new Date('2026-07-09T08:00:00.000Z');
    const rebased = rebaseLegacySchedulingInstant(
      stored,
      new Date('2026-07-09T10:00:00.000Z'),
      new Date('2026-07-09T10:00:00.000Z'),
      { allDay: false, mode: 'start' },
    );
    expect(rebased.toISOString()).toBe('2026-07-09T08:00:00.000Z');
  });
});
