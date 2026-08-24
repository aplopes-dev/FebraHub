import {
  IPI_ENQUADRAMENTOS,
  IPI_ENQUADRAMENTO_CODES,
  isValidIpiEnquadramento,
} from './ipi-enquadramento.table';

/**
 * Teste de imutabilidade (spec erp/019, FR-009): a tabela de enquadramento legal
 * do IPI é estática e só muda por PR revisado. Este snapshot quebra de propósito
 * se alguém alterar o conjunto de códigos sem passar por aqui — mesmo papel do
 * teste do bundle de CAs da SEFAZ.
 */
describe('tabela de enquadramento legal do IPI (cEnq)', () => {
  it('mantém o conjunto de códigos versionado (quebra ao alterar sem revisão)', () => {
    expect([...IPI_ENQUADRAMENTO_CODES].sort()).toEqual([
      '101',
      '102',
      '103',
      '104',
      '201',
      '301',
      '999',
    ]);
  });

  it('todo enquadramento tem código de 1–3 dígitos, descrição e CST', () => {
    for (const entry of IPI_ENQUADRAMENTOS) {
      expect(entry.code).toMatch(/^\d{1,3}$/);
      expect(entry.description.length).toBeGreaterThan(0);
      expect(entry.cst.length).toBeGreaterThan(0);
    }
  });

  it('não tem código duplicado (dado de referência: um code por entrada)', () => {
    // Sem isto, um `code` repetido corromperia qualquer lookup por código
    // (Object.fromEntries manteria a última ocorrência), mesmo com o Set de
    // `IPI_ENQUADRAMENTO_CODES` mascarando a duplicata na validação.
    const codes = IPI_ENQUADRAMENTOS.map((entry) => entry.code);
    expect(new Set(codes).size).toBe(IPI_ENQUADRAMENTOS.length);
  });

  it('aceita um código presente e rejeita ausente/malformado', () => {
    expect(isValidIpiEnquadramento('999')).toBe(true);
    expect(isValidIpiEnquadramento('101')).toBe(true);
    expect(isValidIpiEnquadramento('888')).toBe(false);
    expect(isValidIpiEnquadramento('9999')).toBe(false);
    expect(isValidIpiEnquadramento('abc')).toBe(false);
    expect(isValidIpiEnquadramento(null)).toBe(false);
    expect(isValidIpiEnquadramento('')).toBe(false);
  });
});
