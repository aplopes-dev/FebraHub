/**
 * "Pontos que precisam de atenção" e "Principais avanços" — regras puras
 * sobre os cards já calculados.
 *
 * Nenhuma frase aqui nasce de imaginação: cada alerta cita o número que o
 * disparou, e o campo `fatores` recebe apenas decomposições CALCULADAS (a
 * categoria que mais subiu, o curso que mais caiu) que o service injeta.
 * Quando a causa não está comprovada, o texto diz "fatores a investigar" —
 * exatamente como a spec §14 manda.
 */
import type { Alerta, CardIndicador, Destaque } from './executivo.types';

export const fmtValor = (unidade: string, v: number): string => {
  switch (unidade) {
    case 'brl':
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        notation: Math.abs(v) >= 100_000 ? 'compact' : 'standard',
        maximumFractionDigits: Math.abs(v) >= 100_000 ? 1 : 2,
      }).format(v);
    case 'pct':
      return `${v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })}%`;
    case 'nota':
      return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 });
    default:
      return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
  }
};

const fmtPct = (p: number): string =>
  `${Math.abs(p).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;

interface Regras {
  cards: CardIndicador[];
  /** Decomposições calculadas pelo service para alertas disparados. */
  fatoresPorIndicador: Map<string, string[]>;
  /** Dia do mês corrente — variação dos 2 primeiros dias é ruído, não sinal. */
  diaAtual: number;
}

export function gerarAlertas({ cards, fatoresPorIndicador, diaAtual }: Regras): {
  alertas: Alerta[];
  destaques: Destaque[];
} {
  const alertas: Alerta[] = [];
  const destaques: Destaque[] = [];
  // No máximo UM alerta por indicador: as regras abaixo rodam em ordem de
  // prioridade e a primeira que dispara cala as demais. Sem isto o painel
  // listava "queda de 22%" e "em queda há 3 meses" do MESMO número — duas
  // frases, um fato. 21 alertas não orientam ninguém; 7 orientam.
  const jaAlertado = new Set<string>();

  const alerta = (c: CardIndicador, a: Omit<Alerta, 'id' | 'indicador' | 'setor' | 'setorNome' | 'fatores'>) => {
    if (jaAlertado.has(c.codigo)) return;
    jaAlertado.add(c.codigo);
    alertas.push({
      id: `${c.codigo}:${a.titulo}`,
      indicador: c.codigo,
      setor: c.setor,
      setorNome: c.setorNome,
      fatores: fatoresPorIndicador.get(c.codigo) ?? [],
      ...a,
    });
  };

  const destaque = (c: CardIndicador, titulo: string, frase: string) =>
    destaques.push({ indicador: c.codigo, setor: c.setor, setorNome: c.setorNome, titulo, frase });

  /* ---------- fonte doente: UM alerta por fonte, não por indicador ---------- */
  const porFonteCritica = new Map<string, CardIndicador[]>();
  for (const c of cards) {
    if (c.qualidade.nivel !== 'critico') continue;
    porFonteCritica.set(c.qualidade.fonte, [...(porFonteCritica.get(c.qualidade.fonte) ?? []), c]);
  }
  for (const doFonte of porFonteCritica.values()) {
    const c = doFonte[0];
    const nomes = doFonte.map((x) => x.curto).join(', ');
    alerta(c, {
      nivel: 'amarelo',
      titulo: `${c.qualidade.fonteRotulo}: dados desatualizados`,
      situacao:
        `${c.qualidade.rotulo}. ${doFonte.length === 1 ? 'Afeta o indicador' : 'Afeta os indicadores'}: ${nomes}.`,
      impacto: null,
      acaoSugerida:
        c.qualidade.fonte === 'clint'
          ? 'Conectar a fonte Clint (nunca teve carga automática).'
          : 'Reautorizar a integração na tela de Integrações.',
    });
  }
  // Fonte congelada gera número congelado: alertar "queda" de um dado parado
  // seria alertar o próprio congelamento duas vezes. As regras de variação
  // abaixo pulam esses indicadores; a inadimplência é a exceção consciente
  // (o valor vencido continua vencido — só a foto está velha).
  const fonteCongelada = (c: CardIndicador) =>
    c.qualidade.nivel === 'critico' && c.codigo !== 'inadimplencia';

  for (const c of cards) {
    const f = (v: number) => fmtValor(c.unidade, v);

    /* ---------- meta e esperado ---------- */
    if (fonteCongelada(c)) continue;
    if (c.status.nivel === 'vermelho' && c.esperado != null && c.valor != null) {
      const desvio = c.valor - c.esperado;
      alerta(c, {
        nivel: 'vermelho',
        titulo:
          c.direcao === 'menor_melhor'
            ? `${c.curto} acima do esperado`
            : `${c.curto} abaixo do esperado`,
        situacao: c.parcial
          ? `Realizado ${f(c.valor)} contra ${f(c.esperado)} esperados até esta data.`
          : `Fechou em ${f(c.valor)} contra a meta de ${f(c.esperado)}.`,
        impacto: `${desvio > 0 ? '+' : '−'}${f(Math.abs(desvio))} vs. esperado`,
        acaoSugerida: null,
      });
    } else if (c.status.rotulo === 'Meta em risco' && c.projecao && c.meta) {
      alerta(c, {
        nivel: 'amarelo',
        titulo: `${c.curto}: meta em risco`,
        situacao:
          `O ritmo está dentro do esperado, mas a projeção fecha em ${f(c.projecao.central)} ` +
          `— ${fmtPct((c.projecao.central / c.meta.valor) * 100)} da meta de ${f(c.meta.valor)}.`,
        impacto: `${f(Math.abs(c.meta.valor - c.projecao.central))} projetados abaixo da meta`,
        acaoSugerida: null,
      });
    }

    /* ---------- variações fortes sem meta ---------- */
    // Nos 2 primeiros dias do mês a comparação parcial é ruído (uma manhã de
    // dado contra um mês de referência) — mesmo critério da projeção.
    const variacaoConfiavel = !c.parcial || diaAtual >= 3;
    const cmp = c.comparacoes?.mesAnterior;
    if (variacaoConfiavel && c.meta == null && cmp?.pct != null && c.valor != null && c.tipo === 'fluxo') {
      const caiu = cmp.pct <= -20;
      const subiu = cmp.pct >= 20;
      const ruim = c.direcao === 'menor_melhor' ? subiu : caiu;
      if (ruim && Math.abs(cmp.delta) > 0) {
        alerta(c, {
          nivel: 'amarelo',
          titulo: `${c.curto}: ${caiu ? 'queda' : 'alta'} de ${fmtPct(cmp.pct)}`,
          situacao:
            `${f(c.valor)} contra ${f(cmp.base)} no ${cmp.parcial ? 'mesmo período do mês anterior' : 'mês anterior'}.`,
          impacto: `${cmp.delta > 0 ? '+' : '−'}${f(Math.abs(cmp.delta))}`,
          acaoSugerida: null,
        });
      }
    }

    /* ---------- queda consecutiva (sobre meses FECHADOS) ---------- */
    if (c.tendencia === 'caindo' && c.direcao === 'maior_melhor' && c.tipo === 'fluxo') {
      // No mês fechado a média 3m compara com o próprio valor do mês; no
      // parcial ela compararia com o MTD e mentiria — aí vale só a tendência.
      const quedaForte = !c.parcial
        ? c.comparacoes?.media3?.pct != null && c.comparacoes.media3.pct <= -15
        : true;
      if (quedaForte) {
        alerta(c, {
          nivel: 'amarelo',
          titulo: `${c.curto} em queda há 3 meses`,
          situacao: !c.parcial
            ? `A média dos últimos 3 meses está ${fmtPct(c.comparacoes!.media3!.pct)} acima do valor atual — tendência de queda contínua.`
            : `Os três últimos meses fechados caíram em sequência.`,
          impacto: null,
          acaoSugerida: null,
        });
      }
    }

    /* ---------- inadimplência é ponto de atenção permanente ---------- */
    if (c.codigo === 'inadimplencia' && c.valor != null && c.valor >= 50_000 && c.status.nivel !== 'vermelho') {
      alerta(c, {
        nivel: 'amarelo',
        titulo: `Inadimplência em aberto: ${f(c.valor)}`,
        situacao: `${c.quantidade ?? '?'} parcelas vencidas sem quitação no livro-caixa.`,
        impacto: f(c.valor),
        acaoSugerida: 'Priorizar a faixa de maior atraso na régua de cobrança.',
      });
    }

    /* ---------- destaques ---------- */
    if (c.status.nivel === 'verde' && c.meta && c.valor != null) {
      destaque(
        c,
        c.parcial ? `${c.curto} acima do esperado` : `${c.curto}: meta atingida`,
        c.parcial
          ? `${f(c.valor)} realizados — ${c.esperado != null ? `${f(c.esperado)} eram o esperado até hoje.` : ''}`
          : `${f(c.valor)} contra a meta de ${f(c.meta.valor)}.`,
      );
    }
    if (
      !c.parcial &&
      c.tipo === 'fluxo' &&
      c.comparacoes?.melhorMes &&
      c.valor != null &&
      c.valor > c.comparacoes.melhorMes.valor &&
      c.direcao === 'maior_melhor'
    ) {
      destaque(
        c,
        `${c.curto}: recorde da série`,
        `${f(c.valor)} — o melhor mês de toda a série histórica.`,
      );
    }
    if (variacaoConfiavel && c.meta == null && cmp?.pct != null && c.valor != null && c.tipo === 'fluxo') {
      const bom = c.direcao === 'menor_melhor' ? cmp.pct <= -15 : cmp.pct >= 15;
      if (bom) {
        destaque(
          c,
          `${c.curto}: ${cmp.pct >= 0 ? 'alta' : 'queda'} de ${fmtPct(cmp.pct)}`,
          `${f(c.valor)} contra ${f(cmp.base)} no ${cmp.parcial ? 'mesmo período do mês anterior' : 'mês anterior'}.`,
        );
      }
    }
    if (c.codigo === 'nps_cursos' && c.valor != null && c.valor >= 75) {
      destaque(c, `NPS em zona de excelência`, `Nota média ${f(c.valor)} nas avaliações do período.`);
    }
  }

  // Vermelho antes de amarelo; dentro do nível, mantém a ordem do catálogo.
  alertas.sort((a, b) => (a.nivel === b.nivel ? 0 : a.nivel === 'vermelho' ? -1 : 1));
  return { alertas, destaques };
}
