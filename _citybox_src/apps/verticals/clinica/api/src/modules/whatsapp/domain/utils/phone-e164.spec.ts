import { toWhatsappE164, whatsappNumberCandidates } from './phone-e164';

describe('toWhatsappE164', () => {
  it('normaliza celular BR 11 dígitos', () => {
    expect(toWhatsappE164('(73) 99999-8888')).toBe('+5573999998888');
  });

  it('normaliza fixo BR 10 dígitos', () => {
    expect(toWhatsappE164('73 3521-1234')).toBe('+557335211234');
  });

  it('aceita já com DDI 55', () => {
    expect(toWhatsappE164('+55 73 99999-8888')).toBe('+5573999998888');
  });

  it('retorna null para inválido', () => {
    expect(toWhatsappE164('123')).toBeNull();
    expect(toWhatsappE164('')).toBeNull();
    expect(toWhatsappE164(null)).toBeNull();
  });
});

describe('whatsappNumberCandidates', () => {
  it('inclui a variante sem o nono dígito', () => {
    expect(whatsappNumberCandidates('+5573981990809')).toEqual([
      '5573981990809',
      '557381990809',
    ]);
  });

  it('inclui a variante com o nono dígito', () => {
    expect(whatsappNumberCandidates('+557381990809')).toEqual([
      '557381990809',
      '5573981990809',
    ]);
  });

  it('não gera variante para número fora do BR', () => {
    expect(whatsappNumberCandidates('+13115552368')).toEqual(['13115552368']);
  });
});
