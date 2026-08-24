import { suggestMatches, type MatchCandidateInput } from './match-suggester';

const POSTED_AT = new Date('2026-07-05T00:00:00.000Z');

function candidate(
  overrides: Partial<MatchCandidateInput> = {},
): MatchCandidateInput {
  return {
    financialEntryId: overrides.financialEntryId ?? 'entry-1',
    openBalanceCents: overrides.openBalanceCents ?? 15_000,
    dueDate: overrides.dueDate ?? POSTED_AT,
    description: overrides.description ?? 'Recebível venda',
  };
}

describe('suggestMatches', () => {
  it('valor exato único → kind exact com 1 candidato', () => {
    const result = suggestMatches(15_000, POSTED_AT, 'TED RECEBIDA', [
      candidate({ financialEntryId: 'e1', openBalanceCents: 15_000 }),
    ]);

    expect(result.kind).toBe('exact');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].financialEntryId).toBe('e1');
  });

  it('valor exato empatado entre dois candidatos → kind exact com os dois, ordenados por confiança', () => {
    const result = suggestMatches(15_000, POSTED_AT, 'TED RECEBIDA', [
      candidate({
        financialEntryId: 'far',
        openBalanceCents: 15_000,
        dueDate: new Date('2026-07-02T00:00:00.000Z'), // 3 dias de diferença
      }),
      candidate({
        financialEntryId: 'near',
        openBalanceCents: 15_000,
        dueDate: new Date('2026-07-05T00:00:00.000Z'), // mesma data
      }),
    ]);

    expect(result.kind).toBe('exact');
    expect(result.candidates).toHaveLength(2);
    // Mais próximo por data vem primeiro (maior confiança).
    expect(result.candidates[0].financialEntryId).toBe('near');
    expect(result.candidates[1].financialEntryId).toBe('far');
  });

  it('valor diferente dentro da janela → kind value_divergence, nunca misturado com exact', () => {
    const result = suggestMatches(15_000, POSTED_AT, 'TED RECEBIDA', [
      candidate({ financialEntryId: 'e1', openBalanceCents: 14_950 }),
    ]);

    expect(result.kind).toBe('value_divergence');
    expect(result.candidates).toHaveLength(1);
    expect(result.candidates[0].financialEntryId).toBe('e1');
  });

  it('prioriza candidatos de valor exato sobre divergentes quando ambos existem', () => {
    const result = suggestMatches(15_000, POSTED_AT, 'TED RECEBIDA', [
      candidate({ financialEntryId: 'divergent', openBalanceCents: 14_950 }),
      candidate({ financialEntryId: 'exact', openBalanceCents: 15_000 }),
    ]);

    expect(result.kind).toBe('exact');
    expect(result.candidates.map((c) => c.financialEntryId)).toEqual(['exact']);
  });

  it('sem candidato nenhum → kind none', () => {
    const result = suggestMatches(15_000, POSTED_AT, 'TED RECEBIDA', []);
    expect(result.kind).toBe('none');
    expect(result.candidates).toEqual([]);
  });

  it('usa similaridade de texto como desempate quando a distância de data é igual', () => {
    const result = suggestMatches(
      15_000,
      POSTED_AT,
      'ted recebida joao silva',
      [
        candidate({
          financialEntryId: 'similar-text',
          openBalanceCents: 15_000,
          description: 'Recebível venda João Silva',
        }),
        candidate({
          financialEntryId: 'different-text',
          openBalanceCents: 15_000,
          description: 'Recebível avulso',
        }),
      ],
    );

    expect(result.kind).toBe('exact');
    expect(result.candidates[0].financialEntryId).toBe('similar-text');
  });
});
