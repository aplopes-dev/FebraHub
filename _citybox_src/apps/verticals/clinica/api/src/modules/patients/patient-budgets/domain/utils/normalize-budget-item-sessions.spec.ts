import { normalizeBudgetItemSessions } from './normalize-budget-item-sessions';

describe('normalizeBudgetItemSessions', () => {
  it('retorna null/null para 1 sessão ou ausente', () => {
    expect(normalizeBudgetItemSessions({ sessionIndex: 1, sessionTotal: 1 })).toEqual({
      sessionIndex: null,
      sessionTotal: null,
    });
    expect(normalizeBudgetItemSessions({})).toEqual({
      sessionIndex: null,
      sessionTotal: null,
    });
    expect(
      normalizeBudgetItemSessions({ sessionIndex: null, sessionTotal: null }),
    ).toEqual({
      sessionIndex: null,
      sessionTotal: null,
    });
  });

  it('persiste índice/total só quando total ≥ 2 e índice válido', () => {
    expect(normalizeBudgetItemSessions({ sessionIndex: 1, sessionTotal: 5 })).toEqual({
      sessionIndex: 1,
      sessionTotal: 5,
    });
    expect(normalizeBudgetItemSessions({ sessionIndex: 5, sessionTotal: 5 })).toEqual({
      sessionIndex: 5,
      sessionTotal: 5,
    });
  });

  it('rejeita índice fora do intervalo', () => {
    expect(normalizeBudgetItemSessions({ sessionIndex: 0, sessionTotal: 3 })).toEqual({
      sessionIndex: null,
      sessionTotal: null,
    });
    expect(normalizeBudgetItemSessions({ sessionIndex: 4, sessionTotal: 3 })).toEqual({
      sessionIndex: null,
      sessionTotal: null,
    });
  });
});
