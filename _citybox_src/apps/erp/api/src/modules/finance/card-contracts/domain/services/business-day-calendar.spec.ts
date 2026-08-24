import { addDays, pushToNextBusinessDay } from './business-day-calendar';

// Datas fixas e verificadas (não dependem do relógio do sistema):
// 2026-02-06 = sexta-feira · 2026-02-07 = sábado · 2026-02-08 = domingo
// 2026-02-09 = segunda-feira · 2026-02-05 = quinta-feira
const FRIDAY = new Date(2026, 1, 6);
const SATURDAY = new Date(2026, 1, 7);
const SUNDAY = new Date(2026, 1, 8);
const MONDAY = new Date(2026, 1, 9);
const THURSDAY = new Date(2026, 1, 5);

function isSameDate(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

describe('addDays', () => {
  describe('dias corridos', () => {
    it('soma dias corridos sem pular fim de semana', () => {
      const result = addDays(FRIDAY, 1, 'calendar_days');
      expect(isSameDate(result, SATURDAY)).toBe(true);
    });

    it('0 dias corridos devolve a mesma data (Pix prazo 0)', () => {
      const result = addDays(FRIDAY, 0, 'calendar_days');
      expect(isSameDate(result, FRIDAY)).toBe(true);
    });
  });

  describe('dias úteis', () => {
    it('1 dia útil a partir de sexta pula o fim de semana e cai na segunda', () => {
      const result = addDays(FRIDAY, 1, 'business_days');
      expect(isSameDate(result, MONDAY)).toBe(true);
    });

    it('1 dia útil a partir de quinta cai na sexta (sem fim de semana no meio)', () => {
      const result = addDays(THURSDAY, 1, 'business_days');
      expect(isSameDate(result, FRIDAY)).toBe(true);
    });

    it('3 dias úteis a partir de quinta pulam o fim de semana (quinta+3 úteis = terça)', () => {
      // quinta -> sexta(1) -> [sáb/dom pulados] -> segunda(2) -> terça(3)
      const result = addDays(THURSDAY, 3, 'business_days');
      expect(isSameDate(result, new Date(2026, 1, 10))).toBe(true); // terça-feira
    });

    it('0 dias úteis devolve a mesma data', () => {
      const result = addDays(FRIDAY, 0, 'business_days');
      expect(isSameDate(result, FRIDAY)).toBe(true);
    });
  });
});

describe('pushToNextBusinessDay', () => {
  it('empurra sábado para a segunda-feira seguinte', () => {
    const result = pushToNextBusinessDay(SATURDAY);
    expect(isSameDate(result, MONDAY)).toBe(true);
  });

  it('empurra domingo para a segunda-feira seguinte', () => {
    const result = pushToNextBusinessDay(SUNDAY);
    expect(isSameDate(result, MONDAY)).toBe(true);
  });

  it('não altera uma data que já é dia útil', () => {
    const result = pushToNextBusinessDay(FRIDAY);
    expect(isSameDate(result, FRIDAY)).toBe(true);
  });
});
