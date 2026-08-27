import {
  round2, totalLinha, somarSubtotal, descontoValido, totalComDesconto,
  disponivel, estoqueInsuficiente, conferirSplit, parseCodigoRetirada,
  escolherCodigoRetirada, mediaMinutos, CODIGO_CAPACIDADE,
} from './calculos';

describe('aritmética de valores', () => {
  it('arredonda a 2 casas sem ruído de float', () => {
    expect(round2(0.1 + 0.2)).toBe(0.3);
    expect(totalLinha(3.33, 3)).toBe(9.99);
  });
  it('soma subtotal das linhas', () => {
    expect(somarSubtotal([{ total: 10 }, { total: 5.5 }, { total: 0.01 }])).toBe(15.51);
  });
  it('desconto nunca passa do subtotal nem fica negativo', () => {
    expect(descontoValido(30, 20)).toBe(20);
    expect(descontoValido(-5, 20)).toBe(0);
    expect(descontoValido(8, 20)).toBe(8);
  });
  it('total com desconto satura em 0', () => {
    expect(totalComDesconto(20, 5)).toBe(15);
    expect(totalComDesconto(20, 999)).toBe(0);
  });
});

describe('estoque disponível', () => {
  it('disponível = físico − reservado', () => {
    expect(disponivel(10, 3)).toBe(7);
  });
  it('detecta insuficiência', () => {
    expect(estoqueInsuficiente(8, 7)).toBe(true);
    expect(estoqueInsuficiente(7, 7)).toBe(false);
  });
});

describe('conferirSplit', () => {
  it('fecha dentro da tolerância de 1 centavo', () => {
    expect(conferirSplit([{ valor: 10 }, { valor: 5 }], 15).fecha).toBe(true);
    expect(conferirSplit([{ valor: 14.995 }], 15).fecha).toBe(true);
  });
  it('recusa quando não fecha', () => {
    const r = conferirSplit([{ valor: 10 }], 15);
    expect(r.fecha).toBe(false);
    expect(r.pago).toBe(10);
  });
});

describe('código de retirada', () => {
  it('parseia e valida a faixa 100..999', () => {
    expect(parseCodigoRetirada('042')).toBeNull(); // 42 < 100
    expect(parseCodigoRetirada('150')).toBe(150);
    expect(parseCodigoRetirada(' 999 ')).toBe(999);
    expect(parseCodigoRetirada('99')).toBeNull();
    expect(parseCodigoRetirada('1000')).toBeNull();
    expect(parseCodigoRetirada('abc')).toBeNull();
  });

  it('escolhe um código livre evitando os ocupados (rng determinístico)', () => {
    const ocupados = new Set([100, 101, 102]);
    // rng força a cair em 100,101,102 e depois 103
    const seq = [0, 1 / 900, 2 / 900, 3 / 900];
    let i = 0;
    const escolhido = escolherCodigoRetirada(ocupados, () => seq[i++]);
    expect(escolhido).toBe(103);
  });

  it('devolve null quando todos os 900 estão ocupados', () => {
    const todos = new Set<number>();
    for (let c = 100; c <= 999; c++) todos.add(c);
    expect(todos.size).toBe(CODIGO_CAPACIDADE);
    expect(escolherCodigoRetirada(todos)).toBeNull();
  });

  it('cai no fallback determinístico se o sorteio sempre colidir', () => {
    const ocupados = new Set<number>();
    for (let c = 100; c <= 998; c++) ocupados.add(c); // só 999 livre
    const escolhido = escolherCodigoRetirada(ocupados, () => 0); // sempre 100 (ocupado)
    expect(escolhido).toBe(999);
  });
});

describe('mediaMinutos', () => {
  it('ignora pares nulos e negativos', () => {
    const base = new Date('2024-01-01T00:00:00');
    const mais10 = new Date('2024-01-01T00:10:00');
    const mais20 = new Date('2024-01-01T00:20:00');
    expect(mediaMinutos([[base, mais10], [base, mais20], [base, null], [mais20, base]])).toBe(15);
  });
  it('devolve 0 quando não há par válido', () => {
    expect(mediaMinutos([[null, null]])).toBe(0);
  });
});
