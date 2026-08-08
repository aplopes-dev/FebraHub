import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { PrismaService } from '../../database/prisma.service';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { PERMISSOES } from '../permissoes/catalogo';
import { ExecutivoService } from '../executivo/executivo.service';
import { BrainService, FONTES_SETOR, FONTE_GERAL } from './brain.service';
import { GbrainCliente } from './gbrain.cliente';

const HORA_PADRAO = '04:05';
const FUSO_PADRAO = 'America/Bahia';

/**
 * Ponte entre o banco de negócio e a memória institucional.
 *
 * Publica (1) indicadores do Hub Executivo, (2) páginas ricas por setor com
 * números das views e (3) organograma. Roda sob demanda e por agenda em
 * `brain_config` (hora HH:MM + fuso) — trocável pela tela, sem deploy.
 *
 * O disparo automático é um Interval de 60s que compara o relógio no fuso
 * gravado com a hora configurada (em vez de CronJob dinâmico, que puxaria
 * o pacote `cron` para a árvore de deps da API).
 */
@Injectable()
export class BrainDadosService {
  private readonly logger = new Logger(BrainDadosService.name);
  /** YYYY-MM-DD da última consolidação automática neste processo. */
  private ultimoDisparoDia: string | null = null;

  constructor(
    private readonly prisma: PrismaService,
    private readonly brain: BrainService,
    private readonly executivo: ExecutivoService,
    private readonly gbrain: GbrainCliente,
  ) {}

  async agendaAtual() {
    const cfg = await this.linhaConfig();
    const hora = normalizarHora(cfg.consolidacaoHora);
    const fuso = cfg.consolidacaoFuso || FUSO_PADRAO;
    return {
      ativa: cfg.consolidacaoAtiva,
      hora,
      fuso,
      cron: cronDaHora(hora),
      ultimaConsolidacaoEm: cfg.ultimaConsolidacaoEm,
    };
  }

  async salvarAgenda(
    dados: { ativa?: boolean; hora?: string; fuso?: string },
    autorId: string,
  ) {
    let hora: string | undefined;
    if (dados.hora !== undefined) {
      const parseada = tentarHora(dados.hora);
      if (!parseada) {
        throw new BadRequestException({
          codigo: 'HORA_INVALIDA',
          message: 'Hora inválida. Use HH:MM entre 00:00 e 23:59.',
        });
      }
      hora = parseada;
    }
    await this.prisma.brainConfig.upsert({
      where: { id: 'brain' },
      create: {
        id: 'brain',
        consolidacaoAtiva: dados.ativa ?? true,
        consolidacaoHora: hora ?? HORA_PADRAO,
        consolidacaoFuso: dados.fuso?.trim() || FUSO_PADRAO,
        atualizadoPor: autorId,
      },
      update: {
        ...(dados.ativa !== undefined ? { consolidacaoAtiva: dados.ativa } : {}),
        ...(hora ? { consolidacaoHora: hora } : {}),
        ...(dados.fuso !== undefined ? { consolidacaoFuso: dados.fuso.trim() || FUSO_PADRAO } : {}),
        atualizadoPor: autorId,
      },
    });
    // Permite novo disparo no mesmo dia se a hora mudou para o futuro próximo.
    this.ultimoDisparoDia = null;
    return this.agendaAtual();
  }

  /**
   * A cada minuto: se a agenda está ativa e o relógio no fuso bateu na hora
   * configurada (minuto exato), consolida uma vez por dia civil daquele fuso.
   */
  @Interval(60_000)
  async ticagemConsolidacao(): Promise<void> {
    try {
      const cfg = await this.linhaConfig();
      if (!cfg.consolidacaoAtiva) return;
      const fuso = cfg.consolidacaoFuso?.trim() || FUSO_PADRAO;
      const alvo = normalizarHora(cfg.consolidacaoHora);
      const agora = horaNoFuso(new Date(), fuso);
      if (!agora || agora.hhmm !== alvo) return;
      if (this.ultimoDisparoDia === agora.dia) return;
      this.ultimoDisparoDia = agora.dia;
      await this.sincronizarDiariamente();
    } catch (e) {
      this.logger.warn(`brain: ticagem da consolidação falhou — ${(e as Error).message}`);
    }
  }

  async sincronizar(autor: UsuarioLogado) {
    if (!(await this.gbrain.saudavel())) {
      return { publicadas: 0, motivo: 'A memória institucional está fora do ar.' };
    }

    const servico = contextoDeServico();
    const resumo = await this.executivo.resumo(servico);
    let publicadas = 0;

    const porSetor = new Map<string, typeof resumo.cards>();
    for (const card of resumo.cards) {
      const fonte = (FONTES_SETOR as readonly string[]).includes(card.setor)
        ? card.setor
        : FONTE_GERAL;
      const lista = porSetor.get(fonte) ?? [];
      lista.push(card);
      porSetor.set(fonte, lista);
    }

    for (const [fonte, cards] of porSetor) {
      const alertas = resumo.alertas.filter(
        (a) =>
          a.setor === fonte ||
          (fonte === FONTE_GERAL && !(FONTES_SETOR as readonly string[]).includes(a.setor)),
      );
      const texto = paginaDoSetor(fonte, resumo.referencia.mes, cards, alertas);
      const slug = `${fonte}/indicadores-${resumo.referencia.mes.slice(0, 7)}`;
      publicadas += await this.publicar(
        fonte,
        slug,
        `Indicadores de ${nomeDoSetor(fonte)} — ${competenciaLegivel(resumo.referencia.mes)}`,
        texto,
      );
    }

    // Páginas ricas: números das views do sistema, em prosa, por setor.
    const extras = await this.paginasRicas(resumo.referencia.mes);
    for (const p of extras) {
      publicadas += await this.publicar(p.fonte, p.slug, p.titulo, p.conteudo);
    }

    const membros = await this.prisma.orgMembro.findMany({
      where: { ativo: true },
      orderBy: [{ setor: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
    });
    if (membros.length) {
      publicadas += await this.publicar(
        FONTE_GERAL,
        `${FONTE_GERAL}/organograma`,
        'Organograma — quem faz o quê',
        paginaDoOrganograma(membros),
      );
    }

    await this.prisma.brainConfig.update({
      where: { id: 'brain' },
      data: { ultimaConsolidacaoEm: new Date() },
    }).catch(() => undefined);

    this.logger.log(`brain: ${publicadas} página(s) de dados publicada(s) por ${autor.email}`);
    return { publicadas, competencia: resumo.referencia.mes };
  }

  async sincronizarDiariamente(): Promise<void> {
    try {
      const r = await this.sincronizar(contextoDeServico());
      this.logger.log(`brain: sincronização diária publicou ${r.publicadas} página(s)`);
    } catch (e) {
      this.logger.warn(`brain: sincronização diária falhou — ${(e as Error).message}`);
    }
  }

  private async publicar(fonte: string, slug: string, titulo: string, content: string): Promise<number> {
    try {
      const credencial = await this.brain.credencialDeServico(fonte);
      await this.gbrain.operacao(credencial, 'put_page', { slug, title: titulo, content });
      return 1;
    } catch (e) {
      this.logger.warn(`brain: falha ao publicar ${slug}: ${(e as Error).message}`);
      return 0;
    }
  }

  private async linhaConfig() {
    return this.prisma.brainConfig.upsert({
      where: { id: 'brain' },
      create: { id: 'brain' },
      update: {},
    });
  }

  /**
   * Retratos densos por setor. Cada um vira uma página com slug estável
   * (`comercial/retrato-atual`), reescrita a cada sync.
   */
  private async paginasRicas(mesRef: string): Promise<
    { fonte: string; slug: string; titulo: string; conteudo: string }[]
  > {
    const out: { fonte: string; slug: string; titulo: string; conteudo: string }[] = [];
    const competencia = competenciaLegivel(mesRef);

    // —— Comercial ——
    try {
      const placar = await this.prisma.$queryRawUnsafe<
        { consultora: string; verdes_total: bigint; vermelhas_total: bigint; amarelas_total: bigint; verdes_no_ciclo: bigint; vermelhas_no_ciclo: bigint; brindes_ganhos: bigint }[]
      >(`SELECT consultora, verdes_total, vermelhas_total, amarelas_total, verdes_no_ciclo, vermelhas_no_ciclo, brindes_ganhos
         FROM vw_comercial_placar ORDER BY verdes_total DESC NULLS LAST LIMIT 20`);
      const ranking = await this.prisma.$queryRawUnsafe<
        { consultora: string; vendas: bigint; receita: number }[]
      >(`SELECT consultora, vendas, receita FROM vw_comercial_ranking ORDER BY receita DESC NULLS LAST LIMIT 15`);
      const mensal = await this.prisma.$queryRawUnsafe<{ mes: Date; total: number }[]>(
        `SELECT mes, SUM(valor)::float AS total FROM vw_comercial_geral_mensal
         WHERE mes >= date_trunc('month', now()) - interval '5 months'
         GROUP BY 1 ORDER BY 1`,
      );
      const linhas = [
        `# Retrato comercial — ${competencia}`,
        '',
        'Números do comercial Febracis Salvador extraídos das views do FebraHub.',
        '',
        '## Placar (carinhas / ciclo)',
        '',
        ...placar.map(
          (p) =>
            `- **${p.consultora}**: ${n(p.verdes_total)} verdes, ${n(p.vermelhas_total)} vermelhas, ${n(p.amarelas_total)} amarelas; ` +
            `no ciclo ${n(p.verdes_no_ciclo)} verdes e ${n(p.vermelhas_no_ciclo)} vermelhas; ${n(p.brindes_ganhos)} brinde(s).`,
        ),
        '',
        '## Ranking de receita',
        '',
        ...ranking.map(
          (r) =>
            `- **${r.consultora}**: ${n(r.vendas)} venda(s), receita ${moeda(r.receita)}.`,
        ),
        '',
        '## Faturamento mensal (últimos meses)',
        '',
        ...mensal.map((m) => `- **${mesLabel(m.mes)}**: ${moeda(m.total)}.`),
        '',
        '---',
        'Página gerada automaticamente a partir de vw_comercial_placar, vw_comercial_ranking e vw_comercial_geral_mensal.',
      ];
      out.push({
        fonte: 'comercial',
        slug: 'comercial/retrato-atual',
        titulo: `Retrato comercial — ${competencia}`,
        conteudo: linhas.join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato comercial falhou — ${(e as Error).message}`);
    }

    // —— Financeiro ——
    try {
      const receita = await this.prisma.$queryRawUnsafe<
        { mes: Date; receita: number; receita_bruta: number }[]
      >(`SELECT mes, receita::float, receita_bruta::float FROM vw_financeiro_receita_mensal ORDER BY mes DESC LIMIT 8`);
      const inad = await this.prisma.$queryRawUnsafe<
        { origem?: string; valor?: number; casos?: number }[]
      >(`SELECT * FROM vw_financeiro_inadimplencia_origem LIMIT 20`).catch(() => []);
      const linhas = [
        `# Retrato financeiro — ${competencia}`,
        '',
        '## Receita mensal (líquida e bruta)',
        '',
        ...receita.map(
          (r) =>
            `- **${mesLabel(r.mes)}**: líquida ${moeda(r.receita)}, bruta ${moeda(r.receita_bruta)}.`,
        ),
        '',
      ];
      if (inad.length) {
        linhas.push('## Inadimplência por origem', '');
        for (const i of inad) {
          linhas.push(
            `- ${i.origem ?? 'origem'}: ${moeda(Number(i.valor ?? 0))}` +
              (i.casos != null ? ` (${n(i.casos)} caso(s))` : '') +
              '.',
          );
        }
        linhas.push('');
      }
      linhas.push(
        '---',
        'Página gerada a partir de vw_financeiro_receita_mensal e views de inadimplência.',
      );
      out.push({
        fonte: 'financeiro',
        slug: 'financeiro/retrato-atual',
        titulo: `Retrato financeiro — ${competencia}`,
        conteudo: linhas.join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato financeiro falhou — ${(e as Error).message}`);
    }

    // —— Marketing ——
    try {
      const resumoMkt = await this.prisma.$queryRawUnsafe<
        { mes: Date; investimento: number; leads: bigint; cpl_medio: number }[]
      >(`SELECT mes, investimento::float, leads, cpl_medio::float FROM vw_marketing_resumo_mensal ORDER BY mes DESC LIMIT 8`);
      const linhas = [
        `# Retrato de marketing — ${competencia}`,
        '',
        '## Investimento e leads (Meta Ads / captura)',
        '',
        ...resumoMkt.map(
          (r) =>
            `- **${mesLabel(r.mes)}**: investimento ${moeda(r.investimento)}, ${n(r.leads)} lead(s), CPL médio ${moeda(r.cpl_medio)}.`,
        ),
        '',
        '---',
        'Página gerada a partir de vw_marketing_resumo_mensal.',
      ];
      out.push({
        fonte: 'marketing',
        slug: 'marketing/retrato-atual',
        titulo: `Retrato de marketing — ${competencia}`,
        conteudo: linhas.join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato marketing falhou — ${(e as Error).message}`);
    }

    // —— Pedagógico ——
    try {
      const [kpis] = await this.prisma.$queryRawUnsafe<
        {
          alunos_unicos: bigint;
          matriculas_total: bigint;
          cursos_por_aluno: number;
          alunos_recompra: bigint;
          taxa_recompra: number;
          alunos_fieis: bigint;
        }[]
      >(`SELECT * FROM vw_pedagogico_kpis LIMIT 1`);
      const turmas = await this.prisma.$queryRawUnsafe<
        { mes: Date; nome_curso: string; matriculas: bigint }[]
      >(`SELECT mes, nome_curso, matriculas FROM vw_pedagogico_turmas ORDER BY mes DESC, matriculas DESC NULLS LAST LIMIT 25`);
      if (kpis) {
        const linhas = [
          `# Retrato pedagógico — ${competencia}`,
          '',
          '## KPIs',
          '',
          `- Alunos únicos: **${n(kpis.alunos_unicos)}**.`,
          `- Matrículas totais: **${n(kpis.matriculas_total)}**.`,
          `- Cursos por aluno: **${Number(kpis.cursos_por_aluno).toLocaleString('pt-BR', { maximumFractionDigits: 2 })}**.`,
          `- Alunos com recompra: **${n(kpis.alunos_recompra)}** (taxa ${Number(kpis.taxa_recompra).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%).`,
          `- Alunos fiéis: **${n(kpis.alunos_fieis)}**.`,
          '',
          '## Turmas recentes (amostra)',
          '',
          ...turmas.map(
            (t) => `- **${mesLabel(t.mes)}** · ${t.nome_curso}: ${n(t.matriculas)} matrícula(s).`,
          ),
          '',
          '---',
          'Página gerada a partir de vw_pedagogico_kpis e vw_pedagogico_turmas.',
        ];
        out.push({
          fonte: 'pedagogico',
          slug: 'pedagogico/retrato-atual',
          titulo: `Retrato pedagógico — ${competencia}`,
          conteudo: linhas.join('\n'),
        });
      }
    } catch (e) {
      this.logger.warn(`brain: retrato pedagógico falhou — ${(e as Error).message}`);
    }

    // —— Loja / estoque ——
    // A tela /loja responde por mês (Omie + consolidado). Sem a série mensal
    // na memória, perguntas como "quanto vendi em julho?" só acham o KPI do
    // mês corrente e respondem que não há dado.
    try {
      const kpis = await this.prisma.$queryRawUnsafe<
        { ano: number | null; vendas: bigint; receita: number; ticket_medio: number; produtos: bigint; estoque_custo: number }[]
      >(`SELECT ano, vendas, receita::float, ticket_medio::float, produtos, estoque_custo::float FROM vw_loja_kpis ORDER BY ano NULLS LAST`);

      const mensal = await this.prisma.$queryRawUnsafe<
        {
          mes: Date;
          ano: number;
          vendas: bigint;
          receita: number;
          receita_produtos: number;
          receita_outras: number;
          meta_minima: number | null;
          nivel_atingido: string | null;
          em_curso: boolean;
        }[]
      >(
        `SELECT mes, ano, vendas, receita::float, receita_produtos::float, receita_outras::float,
                meta_minima::float, nivel_atingido, em_curso
           FROM vw_loja_receita_total_mes
          ORDER BY mes DESC
          LIMIT 18`,
      );

      const topProdutos = await this.prisma.$queryRawUnsafe<
        { mes: Date; produto: string; quantidade: number; faturamento: number }[]
      >(
        `SELECT mes, produto, quantidade::float, faturamento::float
           FROM vw_loja_produtos_vendidos_mes
          WHERE mes >= (date_trunc('month', CURRENT_DATE) - interval '5 months')
          ORDER BY mes DESC, faturamento DESC NULLS LAST`,
      );

      const porMesProd = new Map<string, typeof topProdutos>();
      for (const p of topProdutos) {
        const chave = mesLabel(p.mes);
        const lista = porMesProd.get(chave) ?? [];
        if (lista.length < 5) lista.push(p);
        porMesProd.set(chave, lista);
      }

      // Mais recente primeiro: embeddings/busca pegam o topo do texto.
      const linhaDeMes = (m: (typeof mensal)[number]) => {
        const parcial = m.em_curso ? ' (mês em curso, parcial)' : '';
        const meta = m.meta_minima != null
          ? `, meta mínima ${moeda(m.meta_minima)} (${m.nivel_atingido ?? 'sem nível'})`
          : '';
        const outras = Number(m.receita_outras) > 0
          ? ` — produtos ${moeda(m.receita_produtos)}, outras fontes ${moeda(m.receita_outras)}`
          : '';
        return (
          `- **${mesLabel(m.mes)}**: ${n(m.vendas)} venda(s)/cupom(ns), receita total ${moeda(m.receita)}` +
          `${outras}${meta}${parcial}.`
        );
      };
      const linhasMensais = mensal.map(linhaDeMes);

      const linhas = [
        `# Retrato da loja — ${competencia}`,
        '',
        'Números da loja Febracis Salvador (PDV Omie e consolidado da tela Loja).',
        'Use esta página para perguntas sobre quanto a loja vendeu em um mês ou no ano.',
        '',
        '## Receita mensal da loja (do mais recente ao mais antigo)',
        '',
        ...(linhasMensais.length
          ? linhasMensais
          : ['- Ainda sem série mensal consolidada.']),
        '',
        '## KPIs por ano',
        '',
        ...kpis.map((k) => {
          const rotulo = k.ano == null ? 'Total acumulado' : String(k.ano);
          return (
            `- **${rotulo}**: ${n(k.vendas)} venda(s), receita ${moeda(k.receita)}, ` +
            `ticket médio ${moeda(k.ticket_medio)}, ${n(k.produtos)} produto(s) no catálogo, ` +
            `estoque a custo ${moeda(k.estoque_custo)}.`
          );
        }),
        '',
        '## Mais vendidos (por mês recente)',
        '',
      ];

      if (porMesProd.size === 0) {
        linhas.push('- Sem ranking de produtos nos últimos meses.');
      } else {
        for (const [mes, itens] of porMesProd) {
          linhas.push(`### ${mes}`);
          for (const p of itens) {
            linhas.push(
              `- **${p.produto}**: ${n(p.quantidade)} un., faturamento ${moeda(p.faturamento)}.`,
            );
          }
          linhas.push('');
        }
      }

      linhas.push('---', 'Página gerada a partir de vw_loja_receita_total_mes, vw_loja_kpis e vw_loja_produtos_vendidos_mes.');

      const texto = linhas.join('\n');
      out.push({
        fonte: 'loja',
        slug: 'loja/retrato-atual',
        titulo: `Retrato da loja — ${competencia}`,
        conteudo: texto,
      });
      out.push({
        fonte: 'loja',
        slug: 'loja/receita-mensal',
        titulo: `Receita mensal da loja — ${competencia}`,
        conteudo: [
          `# Receita mensal da loja — ${competencia}`,
          '',
          'Total vendido na loja mês a mês (cupons/vendas e receita em reais), do mais recente ao mais antigo.',
          '',
          ...linhasMensais,
          '',
          '---',
          'Fonte: vw_loja_receita_total_mes (mesmo consolidado da tela /loja).',
        ].join('\n'),
      });
      // Uma página por mês recente — a busca por "julho de 2026" acerta o slug.
      for (const m of mensal.slice(0, 12)) {
        const rotulo = mesLabel(m.mes);
        const y = m.mes instanceof Date
          ? m.mes.getUTCFullYear()
          : Number(String(m.mes).slice(0, 4));
        const mo = m.mes instanceof Date
          ? m.mes.getUTCMonth() + 1
          : Number(String(m.mes).slice(5, 7));
        const slugMes = `loja/receita-${y}-${String(mo).padStart(2, '0')}`;
        out.push({
          fonte: 'loja',
          slug: slugMes,
          titulo: `Vendas da loja em ${rotulo}`,
          conteudo: [
            `# Vendas da loja em ${rotulo}`,
            '',
            `Em ${rotulo}, a loja Febracis Salvador registrou:`,
            '',
            `- **Vendas / cupons**: ${n(m.vendas)}`,
            `- **Receita total**: ${moeda(m.receita)}`,
            `- **Receita de produtos (PDV)**: ${moeda(m.receita_produtos)}`,
            `- **Receita de outras fontes** (Livrão, cursos premium, aluguel etc.): ${moeda(m.receita_outras)}`,
            m.meta_minima != null
              ? `- **Meta mínima**: ${moeda(m.meta_minima)} — nível atingido: ${m.nivel_atingido ?? '—'}`
              : '- **Meta mínima**: sem meta cadastrada neste mês',
            m.em_curso ? '- Este mês ainda está em curso (número parcial).' : '- Mês fechado.',
            '',
            '---',
            'Fonte: vw_loja_receita_total_mes (tela /loja).',
          ].join('\n'),
        });
      }
      out.push({
        fonte: 'estoque',
        slug: 'estoque/retrato-atual',
        titulo: `Retrato de estoque (via loja) — ${competencia}`,
        conteudo: texto,
      });
    } catch (e) {
      this.logger.warn(`brain: retrato loja falhou — ${(e as Error).message}`);
    }

    // —— Eventos ——
    try {
      const eventos = await this.prisma.$queryRawUnsafe<
        {
          nome_evento: string;
          data_inicio: Date;
          cidade: string;
          ingressos: bigint;
          compareceram: bigint;
          receita_liquida: number;
        }[]
      >(`SELECT nome_evento, data_inicio, cidade, ingressos, compareceram, receita_liquida::float
         FROM vw_eventos_desempenho ORDER BY data_inicio DESC NULLS LAST LIMIT 30`);
      const linhas = [
        `# Retrato de eventos — ${competencia}`,
        '',
        '## Eventos recentes / próximos',
        '',
        ...eventos.map(
          (e) =>
            `- **${e.nome_evento}** (${mesLabel(e.data_inicio)}, ${e.cidade ?? '—'}): ` +
            `${n(e.ingressos)} ingresso(s), ${n(e.compareceram)} comparecimento(s), ` +
            `receita líquida ${moeda(e.receita_liquida)}.`,
        ),
        '',
        '---',
        'Página gerada a partir de vw_eventos_desempenho.',
      ];
      out.push({
        fonte: 'eventos',
        slug: 'eventos/retrato-atual',
        titulo: `Retrato de eventos — ${competencia}`,
        conteudo: linhas.join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato eventos falhou — ${(e as Error).message}`);
    }

    // —— CRM ——
    try {
      const [c] = await this.prisma.$queryRawUnsafe<
        { clientes: bigint; negocios: bigint; tarefas: bigint; tarefas_abertas: bigint }[]
      >(`SELECT
          (SELECT count(*) FROM crm_clientes)::bigint AS clientes,
          (SELECT count(*) FROM crm_negocios)::bigint AS negocios,
          (SELECT count(*) FROM crm_tarefas)::bigint AS tarefas,
          (SELECT count(*) FROM crm_tarefas WHERE concluida_em IS NULL)::bigint AS tarefas_abertas`);
      out.push({
        fonte: 'crm',
        slug: 'crm/retrato-atual',
        titulo: `Retrato do CRM — ${competencia}`,
        conteudo: [
          `# Retrato do CRM — ${competencia}`,
          '',
          `- Clientes: **${n(c?.clientes)}**.`,
          `- Negócios: **${n(c?.negocios)}**.`,
          `- Tarefas: **${n(c?.tarefas)}** (${n(c?.tarefas_abertas)} em aberto).`,
          '',
          '---',
          'Página gerada a partir das tabelas crm_*.',
        ].join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato CRM falhou — ${(e as Error).message}`);
    }

    // —— Geral / diretoria ——
    try {
      const dir = await this.prisma.$queryRawUnsafe<
        { mes: Date; unidade_negocio: string; receita_liquida: number; transacoes: bigint }[]
      >(`SELECT mes, unidade_negocio, receita_liquida::float, transacoes
         FROM vw_diretoria_consolidado ORDER BY mes DESC, receita_liquida DESC NULLS LAST LIMIT 40`);
      out.push({
        fonte: FONTE_GERAL,
        slug: 'geral/retrato-diretoria',
        titulo: `Consolidado da diretoria — ${competencia}`,
        conteudo: [
          `# Consolidado da diretoria — ${competencia}`,
          '',
          'Receita líquida por unidade de negócio.',
          '',
          ...dir.map(
            (d) =>
              `- **${mesLabel(d.mes)}** · ${d.unidade_negocio}: ${moeda(d.receita_liquida)} em ${n(d.transacoes)} transação(ões).`,
          ),
          '',
          '---',
          'Página gerada a partir de vw_diretoria_consolidado.',
        ].join('\n'),
      });
    } catch (e) {
      this.logger.warn(`brain: retrato diretoria falhou — ${(e as Error).message}`);
    }

    return out;
  }
}

/* --------------------------------- agenda --------------------------------- */

function tentarHora(v: string | null | undefined): string | null {
  const m = String(v ?? '').trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function normalizarHora(v: string | null | undefined): string {
  return tentarHora(v) ?? HORA_PADRAO;
}

function cronDaHora(hora: string): string {
  const [h, m] = normalizarHora(hora).split(':').map(Number);
  return `${m} ${h} * * *`;
}

/** Relógio civil no fuso (sem luxon): usa Intl, que já vem no Node. */
function horaNoFuso(quando: Date, fuso: string): { hhmm: string; dia: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: fuso,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(quando);
    const dig = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    const hour = dig('hour') === '24' ? '00' : dig('hour');
    return {
      hhmm: `${hour}:${dig('minute')}`,
      dia: `${dig('year')}-${dig('month')}-${dig('day')}`,
    };
  } catch {
    return null;
  }
}

/* --------------------------------- textos --------------------------------- */

const NOMES: Record<string, string> = {
  geral: 'Geral',
  comercial: 'Comercial',
  financeiro: 'Financeiro',
  marketing: 'Marketing',
  pedagogico: 'Pedagógico',
  eventos: 'Eventos',
  loja: 'Loja',
  estoque: 'Estoque',
  crm: 'CRM',
};

const nomeDoSetor = (f: string) => NOMES[f] ?? f;

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];

function competenciaLegivel(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1] ?? m}/${ano}`;
}

function mesLabel(d: Date | string | null | undefined): string {
  if (!d) return '—';
  const dt = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(dt.getTime())) return String(d);
  return `${MESES[dt.getUTCMonth()]}/${dt.getUTCFullYear()}`;
}

function n(v: unknown): string {
  const x = Number(v);
  if (!Number.isFinite(x)) return '0';
  return x.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}

function moeda(v: unknown): string {
  const x = Number(v);
  if (!Number.isFinite(x)) return 'sem dado';
  return x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

function valorLegivel(valor: number | null, unidade: string): string {
  if (valor === null || !Number.isFinite(valor)) return 'sem dado';
  if (unidade === 'moeda') return moeda(valor);
  if (unidade === 'percentual') return `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
  return valor.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
}

function paginaDoSetor(
  fonte: string,
  mes: string,
  cards: { nome: string; valor: number | null; quantidade: number | null; unidade: string; parcial: boolean; descricao: string }[],
  alertas: { titulo: string; situacao: string; nivel: string }[],
): string {
  const competencia = competenciaLegivel(mes);
  const linhas: string[] = [
    `# Indicadores de ${nomeDoSetor(fonte)} — ${competencia}`,
    '',
    `Retrato dos números do setor ${nomeDoSetor(fonte)} na competência de ${competencia},`,
    'extraído do Hub Executivo do FebraHub.',
    '',
  ];
  for (const c of cards) {
    const parcial = c.parcial ? ' (mês em curso, número parcial)' : '';
    const qtd = c.quantidade !== null ? ` sobre ${c.quantidade.toLocaleString('pt-BR')} registro(s)` : '';
    linhas.push(
      `- **${c.nome}** em ${competencia}: ${valorLegivel(c.valor, c.unidade)}${qtd}${parcial}.` +
        (c.descricao ? ` ${c.descricao}` : ''),
    );
  }
  if (alertas.length) {
    linhas.push('', '## Alertas do período', '');
    for (const a of alertas) linhas.push(`- **${a.titulo}** (${a.nivel}): ${a.situacao}`);
  }
  linhas.push('', '---', 'Página gerada automaticamente pelo FebraHub a partir do Hub Executivo.');
  return linhas.join('\n');
}

function paginaDoOrganograma(
  membros: { tipo: string; nome: string; funcao: string; setor: string }[],
): string {
  const linhas: string[] = [
    '# Organograma — quem faz o quê',
    '',
    'Quem responde por cada função em cada setor da Febracis Salvador,',
    'incluindo os agentes de IA em operação.',
    '',
  ];
  const porSetor = new Map<string, typeof membros>();
  for (const m of membros) {
    const lista = porSetor.get(m.setor) ?? [];
    lista.push(m);
    porSetor.set(m.setor, lista);
  }
  for (const [setor, lista] of porSetor) {
    linhas.push(`## ${nomeDoSetor(setor)}`, '');
    for (const m of lista) {
      const papel = m.tipo === 'agente' ? 'agente de IA' : 'funcionário';
      linhas.push(`- **${m.nome}** — ${m.funcao} (${papel}, setor ${nomeDoSetor(setor)}).`);
    }
    linhas.push('');
  }
  linhas.push('---', 'Página gerada automaticamente pelo FebraHub a partir do painel Organograma.');
  return linhas.join('\n');
}

function contextoDeServico(): UsuarioLogado {
  return {
    id: '00000000-0000-0000-0000-000000000000',
    email: 'sistema@febrahub',
    nome: 'FebraHub',
    papel: 'admin',
    setor: 'geral',
    setores: ['geral'],
    permissoes: [...PERMISSOES],
    perfilAcesso: null,
  };
}
