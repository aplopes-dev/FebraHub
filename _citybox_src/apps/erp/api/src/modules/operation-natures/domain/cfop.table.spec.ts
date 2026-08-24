import {
  CFOPS,
  ENTRADA_CFOP_CODES,
  SAIDA_CFOP_CODES,
  isEntradaCfop,
  isIcmsLivre,
  isSaidaCfop,
  isValidCfop,
} from './cfop.table';

/**
 * Teste de imutabilidade (spec erp/020, FR-004): a tabela de CFOP é estática e só
 * muda por PR revisado. Este snapshot quebra de propósito se alguém alterar o
 * conjunto de códigos sem passar por aqui — mesmo papel do teste do `cEnq` do IPI.
 */
describe('tabela de CFOP (spec erp/020)', () => {
  it('mantém o conjunto de códigos de ENTRADA versionado', () => {
    expect([...ENTRADA_CFOP_CODES].sort()).toEqual([
      '1101',
      '1102',
      '1111',
      '1113',
      '1201',
      '1202',
      '2101',
      '2102',
      '2201',
      '2202',
    ]);
  });

  it('mantém o conjunto de códigos de SAÍDA versionado', () => {
    expect([...SAIDA_CFOP_CODES].sort()).toEqual([
      '5101',
      '5102',
      '5201',
      '5202',
      '5411',
      '6101',
      '6102',
      '6201',
      '6202',
    ]);
  });

  it('não tem código duplicado (dado de referência: um code por entrada)', () => {
    const codes = CFOPS.map((cfop) => cfop.code);
    expect(new Set(codes).size).toBe(CFOPS.length);
  });

  it('todo CFOP tem 4 dígitos, descrição e direção', () => {
    for (const cfop of CFOPS) {
      expect(cfop.code).toMatch(/^\d{4}$/);
      expect(cfop.description.length).toBeGreaterThan(0);
      expect(['ENTRADA', 'SAIDA']).toContain(cfop.direction);
    }
  });

  it('entrada começa com 1/2 e saída com 5/6 (coerência da direção)', () => {
    for (const code of ENTRADA_CFOP_CODES) {
      expect(['1', '2']).toContain(code[0]);
    }
    for (const code of SAIDA_CFOP_CODES) {
      expect(['5', '6']).toContain(code[0]);
    }
  });

  it('classifica direção e valida pertença', () => {
    expect(isValidCfop('1102')).toBe(true);
    expect(isValidCfop('9999')).toBe(false);
    expect(isValidCfop('110')).toBe(false);
    expect(isValidCfop(null)).toBe(false);
    expect(isEntradaCfop('1102')).toBe(true);
    expect(isEntradaCfop('5202')).toBe(false);
    expect(isSaidaCfop('5202')).toBe(true);
    expect(isSaidaCfop('1102')).toBe(false);
  });
});

/** Derivação ICMS-livre (FR-006): não tributado = ICMS livre. */
describe('isIcmsLivre (spec erp/020)', () => {
  it('CST 00 (Regime Normal, tributado) não é ICMS livre', () => {
    expect(isIcmsLivre('00', null)).toBe(false);
  });

  it('CSOSN 102 (tributado sem crédito) não é ICMS livre', () => {
    expect(isIcmsLivre(null, '102')).toBe(false);
  });

  it('CSOSN 103/300/400 (isenção/imune/não-tributada) são ICMS livre', () => {
    expect(isIcmsLivre(null, '103')).toBe(true);
    expect(isIcmsLivre(null, '300')).toBe(true);
    expect(isIcmsLivre(null, '400')).toBe(true);
  });

  it('sem CST nem CSOSN → não é ICMS livre (sem informação, mantém conservador)', () => {
    expect(isIcmsLivre(null, null)).toBe(false);
  });
});
