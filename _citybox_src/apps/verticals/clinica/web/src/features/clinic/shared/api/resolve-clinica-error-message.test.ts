import { describe, expect, it } from 'vitest';
import { resolveClinicaErrorMessage } from './resolve-clinica-error-message';

describe('resolveClinicaErrorMessage', () => {
  it('mapeia 413 para aviso amigável (não expõe status cru)', () => {
    expect(resolveClinicaErrorMessage(413)).toContain('muito grande');
    expect(resolveClinicaErrorMessage(413)).not.toContain('413');
  });

  it('prioriza mensagem JSON da API quando presente', () => {
    expect(resolveClinicaErrorMessage(400, 'Arquivo de imagem obrigatório')).toBe(
      'Arquivo de imagem obrigatório',
    );
  });

  it('usa fallback genérico só para outros status sem corpo', () => {
    expect(resolveClinicaErrorMessage(500)).toBe('Erro na API de clínica (500)');
  });
});
