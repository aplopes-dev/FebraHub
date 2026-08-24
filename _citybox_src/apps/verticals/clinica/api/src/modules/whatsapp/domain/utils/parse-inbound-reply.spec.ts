import { parseInboundReply } from './parse-inbound-reply';

describe('parseInboundReply', () => {
  it('interpreta exatamente 1 como confirm', () => {
    expect(parseInboundReply('1')).toBe('confirm');
    expect(parseInboundReply(' 1 ')).toBe('confirm');
  });

  it('interpreta exatamente 2 como cancel', () => {
    expect(parseInboundReply('2')).toBe('cancel');
    expect(parseInboundReply(' 2 ')).toBe('cancel');
  });

  it('retorna unknown para qualquer outra coisa', () => {
    expect(parseInboundReply('olá')).toBe('unknown');
    expect(parseInboundReply('3')).toBe('unknown');
    expect(parseInboundReply('OK')).toBe('unknown');
    expect(parseInboundReply('confirmar')).toBe('unknown');
    expect(parseInboundReply('sim')).toBe('unknown');
    expect(parseInboundReply('cancelar')).toBe('unknown');
    expect(parseInboundReply('👍')).toBe('unknown');
    expect(parseInboundReply('[mensagem não textual]')).toBe('unknown');
    expect(parseInboundReply('12')).toBe('unknown');
    expect(parseInboundReply('1.')).toBe('unknown');
  });
});
