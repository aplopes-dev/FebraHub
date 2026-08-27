import { fmtSenha, mensagemRegua, mensagemLembretePronto } from './mensagens';

describe('fmtSenha', () => {
  it('preenche com 2 dígitos e trata nulos', () => {
    expect(fmtSenha(1)).toBe('01');
    expect(fmtSenha(9)).toBe('09');
    expect(fmtSenha(10)).toBe('10');
    expect(fmtSenha(100)).toBe('100');
    expect(fmtSenha(null)).toBe('—');
    expect(fmtSenha(undefined)).toBe('—');
  });
});

describe('mensagemRegua', () => {
  it('confirmado inclui senha, posição (quando houver) e referência do pedido', () => {
    const m = mensagemRegua('confirmado', 7, 1042, 3);
    expect(m).toContain('*07*');
    expect(m).toContain('Posição atual na fila: *3*');
    expect(m).toContain('_Pedido #1042_');
  });

  it('confirmado omite a linha de posição quando posicao é falsy', () => {
    expect(mensagemRegua('confirmado', 7, 1042, null)).not.toContain('Posição atual');
    expect(mensagemRegua('confirmado', 7, 1042)).not.toContain('Posição atual');
    expect(mensagemRegua('confirmado', 7, 1042, 0)).not.toContain('Posição atual');
  });

  it('cobre os quatro eventos com a senha formatada', () => {
    expect(mensagemRegua('proximo', 5, 1)).toContain('PRÓXIMO');
    expect(mensagemRegua('preparacao', 5, 1)).toContain('em preparação');
    expect(mensagemRegua('pronto', 5, 1)).toContain('PRONTO');
    for (const ev of ['proximo', 'preparacao', 'pronto'] as const) {
      expect(mensagemRegua(ev, 5, 1)).toContain('*05*');
    }
  });
});

describe('mensagemLembretePronto', () => {
  it('cita o número do pedido', () => {
    expect(mensagemLembretePronto(1042)).toContain('#1042');
  });
});
