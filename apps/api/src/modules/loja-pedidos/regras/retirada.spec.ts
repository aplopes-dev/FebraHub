import { gerarTokenRetirada, urlRetirada, avaliarRetirada } from './retirada';

describe('gerarTokenRetirada', () => {
  it('gera token base64url de alta entropia, único a cada chamada', () => {
    const a = gerarTokenRetirada();
    const b = gerarTokenRetirada();
    expect(a).not.toEqual(b);
    expect(a).toMatch(/^[A-Za-z0-9_-]+$/); // base64url: sem +, / ou =
    expect(a.length).toBeGreaterThanOrEqual(40);
  });
});

describe('urlRetirada', () => {
  it('monta o deep-link e normaliza a barra final', () => {
    expect(urlRetirada('https://x.com', 'tok')).toBe('https://x.com/loja/retirada/tok');
    expect(urlRetirada('https://x.com/', 'tok')).toBe('https://x.com/loja/retirada/tok');
  });
  it('sem base, devolve o próprio token', () => {
    expect(urlRetirada('', 'tok')).toBe('tok');
  });
});

describe('avaliarRetirada', () => {
  it('pode retirar quando pago, na fila e não retirado', () => {
    const v = avaliarRetirada({ status: 'PRONTO', confirmadoEm: new Date() });
    expect(v).toMatchObject({ pago: true, podeRetirar: true, bloqueio: null });
  });

  it('bloqueia quando não pago', () => {
    const v = avaliarRetirada({ status: 'AGUARDANDO_PAGAMENTO', confirmadoEm: null });
    expect(v.podeRetirar).toBe(false);
    expect(v.bloqueio).toMatch(/não confirmado/);
  });

  it('bloqueia quando cancelado, mesmo com confirmadoEm', () => {
    const v = avaliarRetirada({ status: 'CANCELADO', confirmadoEm: new Date() });
    expect(v.pago).toBe(false);
    expect(v.cancelado).toBe(true);
    expect(v.bloqueio).toBe('Pedido cancelado.');
  });

  it('bloqueia quando já retirado, citando quem e quando', () => {
    const v = avaliarRetirada({
      status: 'RETIRADO', confirmadoEm: new Date(),
      retiradoPorNome: 'Ana', retiradoEm: new Date('2024-01-02T03:04:00'),
    });
    expect(v.retirado).toBe(true);
    expect(v.podeRetirar).toBe(false);
    expect(v.bloqueio).toContain('Já retirado por Ana');
  });
});
