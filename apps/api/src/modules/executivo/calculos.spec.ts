/**
 * Testes do motor de cálculo do Hub Executivo.
 *
 * Cada bloco cobre uma regra da spec que a diretoria vai LER na tela: se um
 * destes quebrar, o painel passa a afirmar algo falso — por isso os casos
 * são cirúrgicos e com números conferíveis à mão.
 */
import {
  calcularComparacoes,
  consolidadoAnual,
  diasNoMes,
  diasUteisAte,
  distribuicaoIntraMes,
  fracaoEsperada,
  projetarAno,
  projetarMes,
  somaAteDia,
  somarMeses,
  statusCard,
  tendenciaDe,
  textoExecutivo,
  type PontoDiario,
  type PontoMensal,
} from './calculos';

/** Série diária sintética: N meses com o MESMO padrão intra-mês. */
function mesesUniformes(meses: string[], porDia: number): PontoDiario[] {
  const dias: PontoDiario[] = [];
  for (const mes of meses) {
    for (let d = 1; d <= diasNoMes(mes); d++) {
      dias.push({ dia: `${mes.slice(0, 7)}-${String(d).padStart(2, '0')}`, valor: porDia });
    }
  }
  return dias;
}

const MESES_2025 = Array.from({ length: 12 }, (_, i) => `2025-${String(i + 1).padStart(2, '0')}-01`);

describe('datas', () => {
  it('conta os dias do mês, inclusive fevereiro bissexto', () => {
    expect(diasNoMes('2026-02-01')).toBe(28);
    expect(diasNoMes('2024-02-01')).toBe(29);
    expect(diasNoMes('2026-07-01')).toBe(31);
  });

  it('soma meses virando o ano nos dois sentidos', () => {
    expect(somarMeses('2026-01-01', -1)).toBe('2025-12-01');
    expect(somarMeses('2026-12-01', 1)).toBe('2027-01-01');
    expect(somarMeses('2026-08-01', -12)).toBe('2025-08-01');
  });

  it('conta dias úteis (ago/2026 começa num sábado)', () => {
    // 01/08/2026 = sábado, 02 = domingo, 03 = segunda.
    expect(diasUteisAte('2026-08-01', 1)).toBe(0);
    expect(diasUteisAte('2026-08-01', 3)).toBe(1);
    expect(diasUteisAte('2026-08-01', 31)).toBe(21);
  });
});

describe('distribuição intra-mês e esperado até a data', () => {
  it('meses uniformes: até o dia 15 de um mês de 30 dias, ~50%', () => {
    const distr = distribuicaoIntraMes(mesesUniformes(['2026-04-01', '2026-06-01', '2025-09-01'], 100), '2026-08-01');
    expect(distr.meses).toBe(3);
    expect(distr.fracao(15)).toBeCloseTo(0.5, 1);
    expect(distr.fracao(30)).toBeCloseTo(1, 5);
  });

  it('concentração no fim do mês desloca o esperado (não é meta/30*dia)', () => {
    // Tudo acontece do dia 20 em diante — como boleto de mensalidade.
    const dias: PontoDiario[] = [];
    for (const mes of ['2026-05-01', '2026-06-01', '2026-07-01']) {
      for (let d = 20; d <= 28; d++) {
        dias.push({ dia: `${mes.slice(0, 7)}-${String(d).padStart(2, '0')}`, valor: 100 });
      }
    }
    const distr = distribuicaoIntraMes(dias, '2026-08-01');
    expect(distr.fracao(15)).toBe(0); // linear diria 50% — e estaria errado
    expect(distr.fracao(28)).toBeCloseTo(1, 5);
  });

  it('o mês em curso NÃO contamina a própria régua', () => {
    const dias = [
      ...mesesUniformes(['2026-06-01', '2026-07-01', '2026-05-01'], 100),
      { dia: '2026-08-05', valor: 999999 },
    ];
    const distr = distribuicaoIntraMes(dias, '2026-08-01');
    expect(distr.meses).toBe(3);
    expect(distr.fracao(5)).toBeCloseTo(5 / 31, 1);
  });

  it('sem histórico cai para dias úteis, e diz que caiu', () => {
    const { fracao, regua } = fracaoEsperada(null, '2026-08-01', 3);
    expect(regua).toBe('dias_uteis');
    expect(fracao).toBeCloseTo(1 / 21, 5);
  });

  it('esperado = meta × fração histórica (o exemplo da spec §9)', () => {
    // Meta 600k, distribuição uniforme, dia 15 de um mês de 31 dias.
    const distr = distribuicaoIntraMes(mesesUniformes(['2026-05-01', '2026-07-01', '2026-03-01'], 10), '2026-08-01');
    const esperado = 600_000 * distr.fracao(15);
    expect(esperado).toBeGreaterThan(280_000);
    expect(esperado).toBeLessThan(300_000);
  });
});

describe('projeção de fechamento do mês', () => {
  const distr = distribuicaoIntraMes(mesesUniformes(MESES_2025, 100), '2026-08-01');

  it('realizado ÷ fração: metade do mês realizada projeta o dobro', () => {
    const p = projetarMes(50_000, 15, '2026-08-01', distr)!;
    // Fração média no dia 15 fica perto de 15/30,4 — a projeção, perto de 101 mil.
    expect(p.central).toBeGreaterThan(95_000);
    expect(p.central).toBeLessThan(107_000);
    expect(p.confianca).toBe('alta'); // 12 meses uniformes, dispersão ~0
    expect(p.faixaMin).not.toBeNull();
    expect(p.faixaMax).not.toBeNull();
    expect(p.faixaMin!).toBeLessThanOrEqual(p.central);
    expect(p.faixaMax!).toBeGreaterThanOrEqual(p.central);
  });

  it('nos 2 primeiros dias não há projeção — chute não vira estimativa', () => {
    expect(projetarMes(10_000, 1, '2026-08-01', distr)).toBeNull();
    expect(projetarMes(10_000, 2, '2026-08-01', distr)).toBeNull();
    expect(projetarMes(10_000, 3, '2026-08-01', distr)).not.toBeNull();
  });

  it('sem histórico: projeção linear simplificada, marcada como tal', () => {
    const p = projetarMes(30_000, 15, '2026-09-01', null)!;
    expect(p.confianca).toBe('insuficiente');
    expect(p.metodo).toContain('simplificada');
    expect(p.faixaMin).toBeNull();
  });

  it('histórico irregular rebaixa a confiança', () => {
    // 6 meses: uns concentram no início, outros no fim — dispersão alta.
    const dias: PontoDiario[] = [];
    for (const [i, mes] of ['2026-02-01', '2026-03-01', '2026-04-01', '2026-05-01', '2026-06-01', '2026-07-01'].entries()) {
      const inicio = i % 2 === 0 ? 1 : 20;
      for (let d = inicio; d < inicio + 8; d++) {
        dias.push({ dia: `${mes.slice(0, 7)}-${String(d).padStart(2, '0')}`, valor: 100 });
      }
    }
    const p = projetarMes(400, 15, '2026-08-01', distribuicaoIntraMes(dias, '2026-08-01'))!;
    expect(['media', 'baixa']).toContain(p.confianca);
  });
});

describe('projeção anual', () => {
  const serie: PontoMensal[] = [];
  for (const ano of [2024, 2025]) {
    for (let m = 1; m <= 12; m++) {
      serie.push({ mes: `${ano}-${String(m).padStart(2, '0')}-01`, valor: 1000 });
    }
  }
  for (let m = 1; m <= 7; m++) serie.push({ mes: `2026-${String(m).padStart(2, '0')}-01`, valor: 1200 });

  it('fechado + mês corrente + sazonalidade dos restantes', () => {
    const projMes = { central: 1100, faixaMin: 1000, faixaMax: 1300, confianca: 'alta' as const, metodo: 'x' };
    const p = projetarAno(serie, 2026, '2026-08-01', projMes)!;
    expect(p.fechado).toBe(7 * 1200);
    // 7 fechados (8400) + corrente (1100) + 4 restantes × 1000 (média sazonal)
    expect(p.central).toBe(8400 + 1100 + 4000);
    expect(p.metodo).toContain('anos anteriores');
  });

  it('sem nenhum dado do ano e sem mês corrente, não projeta', () => {
    expect(projetarAno([], 2026, null, null)).toBeNull();
  });
});

describe('comparações — períodos equivalentes', () => {
  const fechada: PontoMensal[] = [
    { mes: '2025-08-01', valor: 900 },
    { mes: '2026-05-01', valor: 1000 },
    { mes: '2026-06-01', valor: 1100 },
    { mes: '2026-07-01', valor: 1240 },
  ];

  it('mês fechado compara cheio contra cheio', () => {
    const c = calcularComparacoes({ serieFechada: fechada, mesRef: '2026-07-01', valorRef: 1240, parcial: false });
    expect(c.mesAnterior).toEqual({ base: 1100, delta: 140, pct: expect.closeTo(12.7, 0.5) as unknown as number, parcial: false });
    expect(c.melhorMes?.valor).toBe(1100); // melhor entre os ANTERIORES ao ref
    expect(c.piorMes?.valor).toBe(900);
  });

  it('mês parcial compara os MESMOS N dias do mês anterior e do ano anterior', () => {
    // Julho/2026 rendeu 10/dia; agosto até o dia 10 rendeu 200.
    const diario: PontoDiario[] = [];
    for (let d = 1; d <= 31; d++) diario.push({ dia: `2026-07-${String(d).padStart(2, '0')}`, valor: 10 });
    for (let d = 1; d <= 31; d++) diario.push({ dia: `2025-08-${String(d).padStart(2, '0')}`, valor: 5 });

    const c = calcularComparacoes({
      serieFechada: fechada,
      mesRef: '2026-08-01',
      valorRef: 200,
      parcial: true,
      diaAtual: 10,
      diasHistorico: diario,
    });
    // Contra julho INTEIRO (310) daria -35%; contra os mesmos 10 dias (100), +100%.
    expect(c.mesAnterior).toEqual({ base: 100, delta: 100, pct: 100, parcial: true });
    expect(c.anoAnterior?.base).toBe(50);
    expect(c.anoAnterior?.pct).toBe(300);
  });

  it('médias 3/6/12 exigem a janela completa (média de 2 meses não é média de 3)', () => {
    const c = calcularComparacoes({ serieFechada: fechada, mesRef: '2026-08-01', valorRef: 1000, parcial: false });
    expect(c.media3?.base).toBeCloseTo((1000 + 1100 + 1240) / 3, 5);
    expect(c.media6).toBeNull();
    expect(c.media12).toBeNull();
  });

  it('base zero não vira divisão por zero: pct null, delta absoluto fica', () => {
    const c = calcularComparacoes({
      serieFechada: [{ mes: '2026-06-01', valor: 0 }, { mes: '2026-07-01', valor: 50 }],
      mesRef: '2026-07-01',
      valorRef: 50,
      parcial: false,
    });
    expect(c.mesAnterior).toEqual({ base: 0, delta: 50, pct: null, parcial: false });
  });

  it('somaAteDia respeita mês e dia', () => {
    const dias: PontoDiario[] = [
      { dia: '2026-07-01', valor: 1 },
      { dia: '2026-07-15', valor: 2 },
      { dia: '2026-07-16', valor: 4 },
      { dia: '2026-06-10', valor: 8 },
    ];
    expect(somaAteDia(dias, '2026-07-01', 15)).toBe(3);
  });
});

describe('status do card — as quatro cores com rótulo', () => {
  const base = { parcial: true, projecaoCentral: null, historicoMeses: 12 };

  it('verde: dentro/acima do esperado', () => {
    expect(statusCard({ ...base, direcao: 'maior_melhor', meta: 600, esperado: 300, realizado: 310 }).nivel).toBe('verde');
    expect(statusCard({ ...base, direcao: 'maior_melhor', meta: 600, esperado: 300, realizado: 340 }).rotulo).toBe('Acima do esperado');
  });

  it('amarelo: desvio moderado', () => {
    const s = statusCard({ ...base, direcao: 'maior_melhor', meta: 600, esperado: 300, realizado: 270 });
    expect(s).toEqual({ nivel: 'amarelo', rotulo: 'Atenção' });
  });

  it('vermelho: bem abaixo do esperado', () => {
    const s = statusCard({ ...base, direcao: 'maior_melhor', meta: 600, esperado: 300, realizado: 200 });
    expect(s).toEqual({ nivel: 'vermelho', rotulo: 'Abaixo do esperado' });
  });

  it('menor_melhor inverte: despesa acima do esperado é vermelho', () => {
    const s = statusCard({ ...base, direcao: 'menor_melhor', meta: 600, esperado: 300, realizado: 400 });
    expect(s.nivel).toBe('vermelho');
    expect(s.rotulo).toBe('Acima do esperado');
    expect(statusCard({ ...base, direcao: 'menor_melhor', meta: 600, esperado: 300, realizado: 250 }).nivel).toBe('verde');
  });

  it('sem meta: neutro com o rótulo literal da spec', () => {
    const s = statusCard({ ...base, direcao: 'maior_melhor', meta: null, esperado: null, realizado: 100 });
    expect(s).toEqual({ nivel: 'neutro', rotulo: 'Sem meta definida' });
  });

  it('sem meta E sem histórico: cinza', () => {
    const s = statusCard({ ...base, historicoMeses: 1, direcao: 'maior_melhor', meta: null, esperado: null, realizado: 100 });
    expect(s).toEqual({ nivel: 'cinza', rotulo: 'Histórico insuficiente' });
  });

  it('verde no ritmo, mas projeção abaixo da meta = "Meta em risco"', () => {
    const s = statusCard({
      parcial: true, historicoMeses: 12, direcao: 'maior_melhor',
      meta: 600, esperado: 300, realizado: 305, projecaoCentral: 540,
    });
    expect(s).toEqual({ nivel: 'amarelo', rotulo: 'Meta em risco' });
  });

  it('mês fechado compara contra a meta cheia', () => {
    const fechado = { parcial: false, projecaoCentral: null, historicoMeses: 12, esperado: null };
    expect(statusCard({ ...fechado, direcao: 'maior_melhor', meta: 600, realizado: 610 }).rotulo).toBe('Meta atingida');
    expect(statusCard({ ...fechado, direcao: 'maior_melhor', meta: 600, realizado: 560 }).rotulo).toBe('Quase na meta');
    expect(statusCard({ ...fechado, direcao: 'maior_melhor', meta: 600, realizado: 400 }).rotulo).toBe('Meta não atingida');
  });
});

describe('tendência', () => {
  const s = (vals: number[]): PontoMensal[] =>
    vals.map((v, i) => ({ mes: `2026-0${i + 1}-01`, valor: v }));

  it('3 meses subindo / caindo / estável', () => {
    expect(tendenciaDe(s([100, 110, 125]))).toBe('subindo');
    expect(tendenciaDe(s([125, 110, 100]))).toBe('caindo');
    expect(tendenciaDe(s([100, 101, 100]))).toBe('estavel');
  });

  it('menos de 3 meses fechados: sem tendência', () => {
    expect(tendenciaDe(s([100, 110]))).toBeNull();
  });
});

describe('consolidado anual', () => {
  const serie: PontoMensal[] = [];
  for (let m = 1; m <= 12; m++) serie.push({ mes: `2025-${String(m).padStart(2, '0')}-01`, valor: 100 });
  for (let m = 1; m <= 6; m++) serie.push({ mes: `2026-${String(m).padStart(2, '0')}-01`, valor: 150 });

  it('total, média, melhor/pior mês e completude por ano', () => {
    const linhas = consolidadoAnual(serie, 2026);
    const l2025 = linhas.find((l) => l.ano === 2025)!;
    expect(l2025.total).toBe(1200);
    expect(l2025.completo).toBe(true);
    const l2026 = linhas.find((l) => l.ano === 2026)!;
    expect(l2026.total).toBe(900);
    expect(l2026.completo).toBe(false);
    expect(l2026.mesesComDado).toBe(6);
  });

  it('ano parcial compara com o MESMO período do ano anterior, não com o ano cheio', () => {
    const l2026 = consolidadoAnual(serie, 2026).find((l) => l.ano === 2026)!;
    // Contra 2025 inteiro: 900/1200 = -25%. Contra jan–jun/2025 (600): +50%.
    expect(l2026.variacaoAnoAnterior).toBeCloseTo(-25, 5);
    expect(l2026.variacaoPeriodoEquivalente).toBeCloseTo(50, 5);
  });
});

describe('texto executivo — frases nascem de números, nunca de imaginação', () => {
  const fmt = (v: number) => `R$ ${Math.round(v / 1000)} mil`;
  const semComparacao = {
    mesAnterior: null, anoAnterior: null, media3: null, media6: null, media12: null,
    melhorMes: null, piorMes: null,
  };

  it('acima do esperado + variação sobre o período equivalente', () => {
    const t = textoExecutivo({
      nome: 'A receita de cursos', formatar: fmt, direcao: 'maior_melhor',
      realizado: 310_000, esperado: 282_000, meta: 600_000, parcial: true,
      comparacoes: { ...semComparacao, mesAnterior: { base: 276_000, delta: 34_000, pct: 12.4, parcial: true } },
      projecao: null,
    })!;
    expect(t).toContain('acima do esperado');
    expect(t).toContain('12,4%');
    expect(t).toContain('mesmo período do mês anterior');
  });

  it('projeção abaixo da meta entra na frase como risco', () => {
    const t = textoExecutivo({
      nome: 'A receita', formatar: fmt, direcao: 'maior_melhor',
      realizado: 200_000, esperado: 300_000, meta: 600_000, parcial: true,
      comparacoes: semComparacao,
      projecao: { central: 420_000, faixaMin: null, faixaMax: null, confianca: 'media', metodo: 'x' },
    })!;
    expect(t).toContain('projeção');
    expect(t).toContain('70% da meta');
  });

  it('sem realizado, sem frase — nada de encher tela', () => {
    expect(
      textoExecutivo({
        nome: 'X', formatar: fmt, direcao: 'neutra', realizado: null, esperado: null,
        meta: null, parcial: false, comparacoes: semComparacao, projecao: null,
      }),
    ).toBeNull();
  });
});
