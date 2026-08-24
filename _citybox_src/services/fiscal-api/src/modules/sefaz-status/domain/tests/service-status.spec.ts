import { deriveOverallVerdict } from '../service-status';
import type { ServiceStatus } from '../service-status';

describe('deriveOverallVerdict (FR-001b)', () => {
  it('todos OPERATIONAL → ALL_OPERATIONAL', () => {
    expect(deriveOverallVerdict(['OPERATIONAL', 'OPERATIONAL'])).toBe(
      'ALL_OPERATIONAL',
    );
  });

  it('qualquer DOWN → HAS_PROBLEM', () => {
    expect(deriveOverallVerdict(['OPERATIONAL', 'DOWN'])).toBe('HAS_PROBLEM');
  });

  it('qualquer UNREACHABLE → HAS_PROBLEM', () => {
    // O caso central da feature: um órgão inalcançável é problema, mesmo que os
    // outros respondam. Não pode ser suavizado para INCONCLUSIVE.
    expect(deriveOverallVerdict(['OPERATIONAL', 'UNREACHABLE'])).toBe(
      'HAS_PROBLEM',
    );
  });

  it('qualquer LOCAL_ERROR → HAS_PROBLEM', () => {
    expect(deriveOverallVerdict(['LOCAL_ERROR'])).toBe('HAS_PROBLEM');
  });

  it('sem problema mas com UNVERIFIABLE → INCONCLUSIVE', () => {
    // NFS-e hoje é UNVERIFIABLE; se só ela foi pedida e nada mais falhou, não
    // podemos afirmar "tudo certo".
    expect(deriveOverallVerdict(['OPERATIONAL', 'UNVERIFIABLE'])).toBe(
      'INCONCLUSIVE',
    );
  });

  it('só UNVERIFIABLE → INCONCLUSIVE', () => {
    expect(deriveOverallVerdict(['UNVERIFIABLE'])).toBe('INCONCLUSIVE');
  });

  it('problema tem precedência sobre não-verificável', () => {
    // DOWN + UNVERIFIABLE: o problema manda. Não vira INCONCLUSIVE.
    const statuses: ServiceStatus[] = ['UNVERIFIABLE', 'DOWN'];
    expect(deriveOverallVerdict(statuses)).toBe('HAS_PROBLEM');
  });
});
