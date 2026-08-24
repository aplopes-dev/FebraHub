import {
  ageSeconds,
  isFresh,
  minIntervalSeconds,
  nextCheckAt,
} from '../status-window';

const MIN = 180;

describe('status-window (FR-007, FR-005)', () => {
  describe('isFresh', () => {
    it('dentro da janela → fresco (serve do cache)', () => {
      const checked = new Date('2026-08-12T14:00:00Z');
      const now = new Date('2026-08-12T14:02:00Z'); // 120s < 180s
      expect(isFresh(checked, now, MIN)).toBe(true);
    });

    it('no instante exato do limite → vencido', () => {
      // `<` e não `<=`: no limite a janela venceu, permitindo novo contato.
      const checked = new Date('2026-08-12T14:00:00Z');
      const now = new Date('2026-08-12T14:03:00Z'); // 180s
      expect(isFresh(checked, now, MIN)).toBe(false);
    });

    it('além da janela → vencido', () => {
      const checked = new Date('2026-08-12T14:00:00Z');
      const now = new Date('2026-08-12T14:05:00Z'); // 300s
      expect(isFresh(checked, now, MIN)).toBe(false);
    });
  });

  describe('ageSeconds', () => {
    it('idade em segundos inteiros', () => {
      const checked = new Date('2026-08-12T14:00:00Z');
      const now = new Date('2026-08-12T14:00:45Z');
      expect(ageSeconds(checked, now)).toBe(45);
    });

    it('nunca negativo mesmo com relógio adiantado', () => {
      const checked = new Date('2026-08-12T14:00:05Z');
      const now = new Date('2026-08-12T14:00:00Z');
      expect(ageSeconds(checked, now)).toBe(0);
    });
  });

  describe('nextCheckAt', () => {
    it('fim da janela atual', () => {
      const checked = new Date('2026-08-12T14:00:00Z');
      expect(nextCheckAt(checked, MIN).toISOString()).toBe(
        '2026-08-12T14:03:00.000Z',
      );
    });
  });

  describe('minIntervalSeconds', () => {
    const original = process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS;
    afterEach(() => {
      if (original === undefined)
        delete process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS;
      else process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS = original;
    });

    it('default 180 quando env ausente', () => {
      delete process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS;
      expect(minIntervalSeconds()).toBe(180);
    });

    it('respeita a env válida', () => {
      process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS = '300';
      expect(minIntervalSeconds()).toBe(300);
    });

    it('ignora env inválida e cai no default', () => {
      process.env.SEFAZ_STATUS_MIN_INTERVAL_SECONDS = 'abc';
      expect(minIntervalSeconds()).toBe(180);
    });
  });
});
