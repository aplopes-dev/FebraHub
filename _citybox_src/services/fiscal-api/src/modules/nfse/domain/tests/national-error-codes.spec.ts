import {
  NATIONAL_ERROR_CODES,
  NATIONAL_ERROR_HINTS,
  describeNationalError,
} from '../national-error-codes';

/// A tabela é gerada a partir do Anexo I oficial. Estes testes protegem o
/// contrato de uso — não o conteúdo linha a linha, que é dado, não lógica.
describe('national-error-codes', () => {
  it('catalogs the reception rejections that gate every transmission', () => {
    // Regras da aba RN_RECEPCAO_DPS: se estas sumirem, a extração quebrou.
    for (const code of ['E1208', 'E1225', 'E1226', 'E1228', 'E1229']) {
      expect(NATIONAL_ERROR_CODES[code]).toBeDefined();
    }
  });

  it('classifies certificate rejections so the operator knows to look at the certificate', () => {
    // E1208 — "Certificado de Transmissão difere da ICP-Brasil".
    const described = describeNationalError('E1208');

    expect(described.category).toBe('CERTIFICATE');
    expect(described.official).toContain('ICP');
    expect(described.hint).toBe(NATIONAL_ERROR_HINTS.CERTIFICATE);
  });

  it('classifies data-area rejections as an integration defect, not a filling mistake', () => {
    // E1225/E1226 são erros de montagem do envio — o operador não tem o que
    // corrigir no pedido, e mandá-lo "revisar os dados" seria enganoso.
    expect(describeNationalError('E1225').category).toBe('PAYLOAD');
    expect(describeNationalError('E1226').category).toBe('PAYLOAD');
  });

  /// Leiaute novo publica códigos que esta tabela não conhece. O caminho de
  /// degradação não pode inventar significado para um código desconhecido.
  it('degrades to the raw code for anything not catalogued', () => {
    const described = describeNationalError('E9999999');

    expect(described.category).toBe('UNKNOWN');
    expect(described.official).toBeNull();
    expect(described.hint).toContain('E9999999');
  });

  it('gives every catalogued code a non-empty official message and a known hint', () => {
    for (const [code, entry] of Object.entries(NATIONAL_ERROR_CODES)) {
      expect(entry.official.length).toBeGreaterThan(0);
      expect(NATIONAL_ERROR_HINTS[entry.category]).toBeDefined();
      expect(describeNationalError(code).category).not.toBe('UNKNOWN');
    }
  });
});
