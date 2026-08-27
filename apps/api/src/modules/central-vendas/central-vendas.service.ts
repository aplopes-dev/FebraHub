/**
 * CentralVendasService — Central de Vendas e Conciliação (FebraHub + Stone + Omie).
 *
 * Princípio (PRD §2, §56, §58): existe o REGISTRO DE ORIGEM (o que cada sistema
 * mandou) e a VENDA CONSOLIDADA (o evento comercial real). Conciliar é criar a
 * RELAÇÃO — nunca fundir/sobrescrever/apagar o registro original. O faturamento
 * consolidado é a soma das VendaConsolidada, NUNCA a soma das origens (senão a
 * mesma venda em 3 sistemas triplicaria o faturamento).
 *
 * Fluxo:
 *   1. ingestão: espelha LojaPedido/StoneConciliacaoTransacao/OmieLancamento em
 *      VendaOrigem (idempotente por [origem, externalId]).
 *   2. conciliação: determinística (IDs inequívocos) → heurística (score) → o
 *      resto vira consolidada single-origem com status próprio (SOMENTE_*).
 *   3. consultas/cards/exportação e ações manuais (conciliar/desvincular).
 */
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { StoneConciliacaoService } from '../stone-conciliacao/stone-conciliacao.service';
import {
  ConciliarDto,
  DesvincularDto,
  ListaVendasQuery,
  ReconciliarDto,
  SincronizarStoneDto,
} from './central-vendas.dto';

const D = (n: number | string | Prisma.Decimal) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));
const num = (v: Prisma.Decimal | number | null | undefined) => (v == null ? 0 : Number(v));

/** Tolerância de valor (centavos) considerada "mesmo valor" na heurística. */
const TOL_VALOR = 0.05;
/** Janela de tempo (minutos) para casar Stone↔FebraHub por horário. */
const JANELA_MIN = 20;
/** Limiar default de conciliação automática por heurística. */
const LIMIAR_AUTO = 85;

@Injectable()
export class CentralVendasService {
  private readonly logger = new Logger(CentralVendasService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly stone: StoneConciliacaoService,
  ) {}

  // ==================================================================
  // INGESTÃO — espelha as tabelas de negócio em VendaOrigem (idempotente)
  // ==================================================================

  /** Espelha os pedidos da Loja (FebraHub) como VendaOrigem. */
  async ingerirFebrahub(desde?: Date): Promise<number> {
    const where: Prisma.LojaPedidoWhereInput = {
      status: { notIn: ['AGUARDANDO_PAGAMENTO', 'EXPIRADO'] },
    };
    if (desde) where.criadoEm = { gte: desde };

    const pedidos = await this.prisma.lojaPedido.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 5000,
      include: {
        operacao: { select: { nome: true, slug: true } },
        pagamentos: { select: { forma: true, valor: true, status: true } },
      },
    });

    let n = 0;
    for (const p of pedidos) {
      const pago = p.pagamentos.find((x) => x.status === 'PAGO') ?? p.pagamentos[0];
      const cancelado = p.status === 'CANCELADO';
      await this.upsertOrigem({
        origem: 'FEBRAHUB',
        externalId: p.id,
        lojaPedidoId: p.id,
        valor: num(p.total),
        dataHora: p.confirmadoEm ?? p.criadoEm,
        formaPagamento: pago?.forma ?? null,
        unidade: p.operacao?.nome ?? null,
        clienteNome: p.clienteNome || null,
        status: cancelado ? 'CANCELADA' : 'OK',
        terminal: p.canal,
        payload: {
          numero: p.numero,
          canal: p.canal,
          operador: p.operadorNome,
          operacao: p.operacao?.nome,
          statusPedido: p.status,
        },
      });
      n++;
    }
    return n;
  }

  /** Espelha as transações Stone (da conciliação) como VendaOrigem. */
  async ingerirStone(desde?: Date): Promise<number> {
    const where: Prisma.StoneConciliacaoTransacaoWhereInput = {};
    if (desde) where.referenceDate = { gte: desde };

    const txs = await this.prisma.stoneConciliacaoTransacao.findMany({
      where,
      orderBy: { captureDateTime: 'desc' },
      take: 10000,
    });

    let n = 0;
    for (const t of txs) {
      const forma = t.accountType === '2' ? 'CARTAO_DEBITO' : 'CARTAO_CREDITO';
      await this.upsertOrigem({
        origem: 'STONE',
        externalId: t.acquirerTransactionKey,
        stoneTransacaoId: t.id,
        valor: num(t.grossAmount),
        dataHora: t.captureDateTime ?? t.authorizationDateTime,
        nsu: t.acquirerTransactionKey,
        tid: t.initiatorTransactionKey,
        autorizacao: t.authorizationCode,
        bandeira: t.brandNome,
        formaPagamento: forma,
        parcelas: t.numberOfInstallments,
        terminal: t.poiSerialNumber,
        status: t.cancelado ? 'CANCELADA' : 'OK',
        payload: t.bruto as Prisma.InputJsonValue,
      });
      n++;
    }
    return n;
  }

  /** Espelha os lançamentos Omie (que já apontam para o pedido) como VendaOrigem. */
  async ingerirOmie(desde?: Date): Promise<number> {
    const where: Prisma.OmieLancamentoWhereInput = { status: 'lancado' };
    if (desde) where.criadoEm = { gte: desde };

    const lancs = await this.prisma.omieLancamento.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 5000,
      include: { pedido: { select: { total: true, confirmadoEm: true, criadoEm: true, clienteNome: true } } },
    });

    let n = 0;
    for (const l of lancs) {
      await this.upsertOrigem({
        origem: 'OMIE',
        externalId: l.omiePedidoId ? String(l.omiePedidoId) : l.id,
        omieLancamentoId: l.id,
        lojaPedidoId: l.pedidoId,
        valor: num(l.pedido?.total ?? 0),
        dataHora: l.pedido?.confirmadoEm ?? l.pedido?.criadoEm ?? l.criadoEm,
        clienteNome: l.pedido?.clienteNome || null,
        status: 'OK',
        payload: { omieNumero: l.omieNumero, omiePedidoId: l.omiePedidoId ? String(l.omiePedidoId) : null },
      });
      n++;
    }
    return n;
  }

  private async upsertOrigem(dados: {
    origem: string;
    externalId: string;
    lojaPedidoId?: string | null;
    stoneTransacaoId?: string | null;
    omieLancamentoId?: string | null;
    valor: number;
    dataHora?: Date | null;
    nsu?: string | null;
    tid?: string | null;
    autorizacao?: string | null;
    bandeira?: string | null;
    formaPagamento?: string | null;
    parcelas?: number | null;
    terminal?: string | null;
    unidade?: string | null;
    clienteNome?: string | null;
    clienteDoc?: string | null;
    status?: string;
    payload?: Prisma.InputJsonValue | null;
  }) {
    const comum = {
      lojaPedidoId: dados.lojaPedidoId ?? null,
      stoneTransacaoId: dados.stoneTransacaoId ?? null,
      omieLancamentoId: dados.omieLancamentoId ?? null,
      valor: D(dados.valor),
      dataHora: dados.dataHora ?? null,
      nsu: dados.nsu ?? null,
      tid: dados.tid ?? null,
      autorizacao: dados.autorizacao ?? null,
      bandeira: dados.bandeira ?? null,
      formaPagamento: dados.formaPagamento ?? null,
      parcelas: dados.parcelas ?? null,
      terminal: dados.terminal ?? null,
      unidade: dados.unidade ?? null,
      clienteNome: dados.clienteNome ?? null,
      clienteDoc: dados.clienteDoc ?? null,
      status: dados.status ?? 'OK',
      payload: (dados.payload ?? undefined) as Prisma.InputJsonValue | undefined,
    };
    await this.prisma.vendaOrigem.upsert({
      where: { origem_externalId: { origem: dados.origem, externalId: dados.externalId } },
      create: { origem: dados.origem, externalId: dados.externalId, ...comum },
      // Só atualiza campos que podem mudar; NÃO mexe no vínculo já feito.
      update: {
        valor: comum.valor,
        dataHora: comum.dataHora,
        status: comum.status,
        payload: comum.payload,
      },
    });
  }

  // ==================================================================
  // CONCILIAÇÃO — determinística → heurística → single-origem
  // ==================================================================

  /**
   * Reconcilia todas as origens ainda sem consolidada, num intervalo. Cada
   * origem sem vínculo:
   *  1. tenta casar por IDs inequívocos (mesmo lojaPedidoId) → determinístico;
   *  2. tenta casar Stone↔FebraHub por heurística (valor+tempo+terminal) → score;
   *  3. se nada casar, vira uma consolidada single-origem (SOMENTE_*).
   * Ao final, recomputa o status de cada consolidada tocada.
   */
  async reconciliar(dto: ReconciliarDto, u?: UsuarioLogado): Promise<{ vinculadas: number; criadas: number; sugeridas: number }> {
    const limiar = dto.limiar ?? LIMIAR_AUTO;
    const de = dto.dataInicio ? new Date(dto.dataInicio) : undefined;
    const ate = dto.dataFim ? new Date(dto.dataFim + 'T23:59:59Z') : undefined;

    const where: Prisma.VendaOrigemWhereInput = { consolidadaId: null };
    if (de || ate) {
      where.dataHora = {};
      if (de) (where.dataHora as Prisma.DateTimeFilter).gte = de;
      if (ate) (where.dataHora as Prisma.DateTimeFilter).lte = ate;
    }

    const soltas = await this.prisma.vendaOrigem.findMany({ where, orderBy: { dataHora: 'asc' }, take: 5000 });
    let vinculadas = 0;
    let criadas = 0;
    let sugeridas = 0;
    const tocadas = new Set<string>();

    // Passo 1 — determinístico: Omie/FebraHub que apontam o MESMO lojaPedidoId.
    for (const o of soltas) {
      if (o.consolidadaId) continue;
      if (!o.lojaPedidoId) continue;
      // Existe outra origem já consolidada com o mesmo lojaPedidoId?
      const irmao = await this.prisma.vendaOrigem.findFirst({
        where: { lojaPedidoId: o.lojaPedidoId, consolidadaId: { not: null }, id: { not: o.id } },
      });
      if (irmao?.consolidadaId) {
        await this.vincular(o.id, irmao.consolidadaId, 'deterministico', 100, u);
        tocadas.add(irmao.consolidadaId);
        vinculadas++;
      }
    }

    // Passo 2 — cria consolidada base a partir das origens FEBRAHUB soltas
    // (é a espinha dorsal do evento comercial), agregando Omie do mesmo pedido.
    const atualizadas = await this.prisma.vendaOrigem.findMany({ where, orderBy: { dataHora: 'asc' }, take: 5000 });
    for (const o of atualizadas) {
      if (o.consolidadaId) continue;
      if (o.origem !== 'FEBRAHUB') continue;
      const vc = await this.criarConsolidadaDe(o, u);
      tocadas.add(vc);
      criadas++;
      // agrega Omie do mesmo pedido
      if (o.lojaPedidoId) {
        const omies = await this.prisma.vendaOrigem.findMany({
          where: { origem: 'OMIE', lojaPedidoId: o.lojaPedidoId, consolidadaId: null },
        });
        for (const om of omies) {
          await this.vincular(om.id, vc, 'deterministico', 100, u);
          vinculadas++;
        }
      }
    }

    // Passo 3 — heurística Stone→FebraHub: casa transações Stone soltas às
    // consolidadas FebraHub por valor + horário próximo (+ terminal, se houver).
    const stoneSoltas = await this.prisma.vendaOrigem.findMany({
      where: { ...where, origem: 'STONE', consolidadaId: null },
      orderBy: { dataHora: 'asc' },
      take: 5000,
    });
    for (const s of stoneSoltas) {
      const alvo = await this.melhorCandidatoFebrahub(s);
      if (alvo && alvo.score >= limiar) {
        await this.vincular(s.id, alvo.consolidadaId, 'heuristico', alvo.score, u, alvo.inferido);
        tocadas.add(alvo.consolidadaId);
        vinculadas++;
      } else if (alvo && alvo.score >= 60) {
        // sugestão (não vincula): fica marcado o score p/ a UI oferecer "conciliar".
        sugeridas++;
      }
    }

    // Passo 4 — o que sobrou (Stone/Omie sem par) vira single-origem.
    const orfas = await this.prisma.vendaOrigem.findMany({ where: { ...where, consolidadaId: null }, take: 5000 });
    for (const o of orfas) {
      const vc = await this.criarConsolidadaDe(o, u);
      tocadas.add(vc);
      criadas++;
    }

    // Recomputa status das consolidadas tocadas.
    for (const id of tocadas) await this.recomputarStatus(id);

    this.logger.log(`Reconciliação: ${vinculadas} vinculadas, ${criadas} consolidadas criadas, ${sugeridas} sugestões.`);
    return { vinculadas, criadas, sugeridas };
  }

  /** Cria uma VendaConsolidada "semente" a partir de uma origem e a vincula. */
  private async criarConsolidadaDe(o: { id: string; valor: Prisma.Decimal; dataHora: Date | null; unidade: string | null; clienteNome: string | null; clienteDoc: string | null; formaPagamento: string | null; origem: string; vinculoModo?: string | null }, u?: UsuarioLogado): Promise<string> {
    const vc = await this.prisma.vendaConsolidada.create({
      data: {
        unidade: o.unidade,
        clienteNome: o.clienteNome,
        clienteDoc: o.clienteDoc,
        dataVenda: o.dataHora ?? new Date(),
        formaPagamento: o.formaPagamento,
        valorTotal: o.valor,
        statusConciliacao: 'REQUER_REVISAO',
      },
    });
    await this.prisma.vendaOrigem.update({
      where: { id: o.id },
      data: { consolidadaId: vc.id, vinculoModo: o.vinculoModo ?? 'auto', vinculoScore: 100 },
    });
    await this.auditar('vinculo_auto', vc.id, o.id, `Consolidada criada a partir de ${o.origem}`, u);
    return vc.id;
  }

  /** Vincula uma origem a uma consolidada existente (auto/manual). */
  private async vincular(origemId: string, consolidadaId: string, modo: string, score: number, u?: UsuarioLogado, inferido = false) {
    await this.prisma.vendaOrigem.update({
      where: { id: origemId },
      data: { consolidadaId, vinculoModo: modo, vinculoScore: score },
    });
    if (inferido) {
      await this.prisma.vendaConsolidada.update({ where: { id: consolidadaId }, data: { inferido: true } });
    }
    await this.auditar(modo === 'manual' ? 'vinculo_manual' : 'vinculo_auto', consolidadaId, origemId, `Vínculo ${modo} (score ${score}${inferido ? ', inferido' : ''})`, u);
  }

  /**
   * Busca a melhor consolidada FebraHub para uma transação Stone, por heurística.
   * Score (PRD §15): NSU/TID igual em algum registro FebraHub = 95; valor+janela
   * curta+terminal = 85; valor+mesmo dia = 70. Retorna também `inferido`.
   */
  private async melhorCandidatoFebrahub(s: { id: string; valor: Prisma.Decimal; dataHora: Date | null; terminal: string | null }): Promise<{ consolidadaId: string; score: number; inferido: boolean } | null> {
    if (!s.dataHora) return null;
    const inicio = new Date(s.dataHora.getTime() - JANELA_MIN * 60_000);
    const fim = new Date(s.dataHora.getTime() + JANELA_MIN * 60_000);
    const valor = num(s.valor);

    // candidatos: consolidadas com uma origem FEBRAHUB de mesmo valor, na janela.
    const candidatos = await this.prisma.vendaOrigem.findMany({
      where: {
        origem: 'FEBRAHUB',
        consolidadaId: { not: null },
        valor: { gte: D(valor - TOL_VALOR), lte: D(valor + TOL_VALOR) },
        dataHora: { gte: new Date(s.dataHora.getTime() - 24 * 3600_000), lte: new Date(s.dataHora.getTime() + 24 * 3600_000) },
        // ainda não tem Stone vinculado nessa consolidada
        consolidada: { origens: { none: { origem: 'STONE' } } },
      },
      take: 50,
    });
    if (!candidatos.length) return null;

    let melhor: { consolidadaId: string; score: number; inferido: boolean } | null = null;
    for (const c of candidatos) {
      if (!c.consolidadaId || !c.dataHora) continue;
      const dtMin = Math.abs(c.dataHora.getTime() - s.dataHora.getTime()) / 60_000;
      let score = 70; // mesmo valor + mesmo dia
      let inferido = true;
      if (dtMin <= JANELA_MIN) {
        score = 85; // valor + horário muito próximo
        if (s.terminal && c.terminal && s.terminal === c.terminal) score = 92;
      }
      if (!melhor || score > melhor.score) melhor = { consolidadaId: c.consolidadaId, score, inferido };
    }
    return melhor;
  }

  /**
   * Recomputa `statusConciliacao` e os valores agregados de uma consolidada a
   * partir das origens vinculadas (PRD §19). Regra de faturamento: valorTotal =
   * o valor comercial (prioriza FebraHub; senão Omie; senão Stone bruto).
   */
  async recomputarStatus(consolidadaId: string) {
    const vc = await this.prisma.vendaConsolidada.findUnique({
      where: { id: consolidadaId },
      include: { origens: true },
    });
    if (!vc) return;
    const origens = vc.origens;
    if (!origens.length) {
      // sem origens: não é mais uma venda real — marca como revisão (não apaga).
      await this.prisma.vendaConsolidada.update({ where: { id: consolidadaId }, data: { statusConciliacao: 'REQUER_REVISAO' } });
      return;
    }

    const has = (o: string) => origens.some((x) => x.origem === o && x.status !== 'CANCELADA');
    const fh = has('FEBRAHUB');
    const st = has('STONE');
    const om = has('OMIE');

    const stones = origens.filter((o) => o.origem === 'STONE');
    const febra = origens.find((o) => o.origem === 'FEBRAHUB');
    const omie = origens.find((o) => o.origem === 'OMIE');

    // Valor comercial (faturamento): FebraHub > Omie > Stone.
    const valorTotal = num(febra?.valor) || num(omie?.valor) || stones.reduce((s, x) => s + num(x.valor), 0);
    const valorRecebido = stones.filter((x) => x.status !== 'CANCELADA' && x.status !== 'ESTORNADA').reduce((s, x) => s + num(x.valor), 0);
    const valorEstornado = stones.filter((x) => x.status === 'ESTORNADA' || x.status === 'CHARGEBACK').reduce((s, x) => s + num(x.valor), 0);

    let status: string;
    const cancelada = origens.every((o) => o.status === 'CANCELADA');
    if (cancelada) {
      status = 'CANCELADA';
    } else if (fh && st && om) {
      status = 'CONCILIADA';
    } else if (fh && st) {
      // divergência de valor entre FebraHub e Stone?
      const difere = febra && stones.length && Math.abs(num(febra.valor) - stones.reduce((s, x) => s + num(x.valor), 0)) > TOL_VALOR;
      status = difere ? 'DIVERGENCIA_VALOR' : 'FEBRAHUB_STONE';
      // parcial: Stone soma menos que o total FebraHub
      if (!difere && stones.reduce((s, x) => s + num(x.valor), 0) + TOL_VALOR < num(febra?.valor)) status = 'PARCIALMENTE_CONCILIADA';
    } else if (fh && om) {
      status = 'FEBRAHUB_OMIE';
    } else if (st && om) {
      status = 'STONE_OMIE';
    } else if (st) {
      status = 'SOMENTE_STONE';
    } else if (fh) {
      status = 'SOMENTE_FEBRAHUB';
    } else if (om) {
      status = 'SOMENTE_OMIE';
    } else {
      status = 'REQUER_REVISAO';
    }
    if (valorEstornado > 0 && valorEstornado + TOL_VALOR >= valorTotal) status = 'ESTORNADA';

    await this.prisma.vendaConsolidada.update({
      where: { id: consolidadaId },
      data: {
        statusConciliacao: status,
        valorTotal: D(valorTotal),
        valorRecebido: D(valorRecebido),
        valorEstornado: D(valorEstornado),
        unidade: vc.unidade ?? febra?.unidade ?? null,
        clienteNome: vc.clienteNome ?? febra?.clienteNome ?? omie?.clienteNome ?? null,
      },
    });
  }

  // ==================================================================
  // AÇÕES MANUAIS
  // ==================================================================

  /** Sincroniza Stone (importa o intervalo), ingere tudo e reconcilia. */
  async sincronizarStone(dto: SincronizarStoneDto, u: UsuarioLogado) {
    let importadas = { transacoes: 0, jaImportados: 0, erros: 0 };
    if (this.stone.configurado && dto.de && dto.ate) {
      const de = dto.de.replace(/\D/g, '');
      const ate = dto.ate.replace(/\D/g, '');
      if (de.length === 8 && ate.length === 8) {
        const r = await this.stone.importarPeriodo(de, ate, !!dto.forcar);
        importadas = { transacoes: r.transacoes, jaImportados: r.jaImportados, erros: r.erros };
      }
    }
    const desde = dto.de ? new Date(`${dto.de.slice(0, 4)}-${dto.de.slice(4, 6)}-${dto.de.slice(6, 8)}`) : this.trintaDiasAtras();
    const [nStone, nFh, nOmie] = await Promise.all([
      this.ingerirStone(desde),
      this.ingerirFebrahub(desde),
      this.ingerirOmie(desde),
    ]);
    const rec = await this.reconciliar({ dataInicio: desde.toISOString().slice(0, 10) }, u);
    await this.auditar('sync', null, null, `Sync Stone: ${importadas.transacoes} novas, ${nStone} origens Stone, ${nFh} FebraHub, ${nOmie} Omie`, u);
    return { importadas, origens: { stone: nStone, febrahub: nFh, omie: nOmie }, reconciliacao: rec };
  }

  /** Reingere tudo (sem chamar a API Stone) e reconcilia. Uso administrativo. */
  async ressincronizar(u: UsuarioLogado) {
    const desde = this.trintaDiasAtras();
    const [nStone, nFh, nOmie] = await Promise.all([
      this.ingerirStone(desde),
      this.ingerirFebrahub(desde),
      this.ingerirOmie(desde),
    ]);
    const rec = await this.reconciliar({ dataInicio: desde.toISOString().slice(0, 10) }, u);
    return { origens: { stone: nStone, febrahub: nFh, omie: nOmie }, reconciliacao: rec };
  }

  /** Conciliação manual: liga origens a uma consolidada (nova ou existente). */
  async conciliarManual(dto: ConciliarDto, u: UsuarioLogado) {
    if (!dto.origemIds?.length) throw new BadRequestException('Informe as origens a conciliar.');
    const origens = await this.prisma.vendaOrigem.findMany({ where: { id: { in: dto.origemIds } } });
    if (origens.length !== dto.origemIds.length) throw new NotFoundException('Alguma origem não foi encontrada.');

    let consolidadaId = dto.consolidadaId ?? null;
    const antigas = new Set<string>();
    for (const o of origens) if (o.consolidadaId) antigas.add(o.consolidadaId);

    if (!consolidadaId) {
      // cria a consolidada semente a partir da primeira origem FEBRAHUB (ou a 1ª).
      const base = origens.find((o) => o.origem === 'FEBRAHUB') ?? origens[0];
      consolidadaId = await this.criarConsolidadaDe(base, u);
    }
    for (const o of origens) {
      if (o.consolidadaId === consolidadaId) continue;
      await this.vincular(o.id, consolidadaId, 'manual', 100, u);
    }
    // recomputa a nova e as antigas (que podem ter ficado sem origens).
    await this.recomputarStatus(consolidadaId);
    for (const a of antigas) if (a !== consolidadaId) await this.limparSeVazia(a);
    return this.detalhe(consolidadaId);
  }

  /** Desvincula uma origem da consolidada. Nunca apaga a origem (PRD §17, §58). */
  async desvincular(dto: DesvincularDto, u: UsuarioLogado) {
    const o = await this.prisma.vendaOrigem.findUnique({ where: { id: dto.origemId } });
    if (!o) throw new NotFoundException('Origem não encontrada.');
    const antiga = o.consolidadaId;
    if (!antiga) return { ok: true, message: 'Origem já estava sem vínculo.' };

    await this.prisma.vendaOrigem.update({ where: { id: o.id }, data: { consolidadaId: null, vinculoModo: null, vinculoScore: null } });
    await this.auditar('desvinculo', antiga, o.id, `Desvínculo${dto.motivo ? `: ${dto.motivo}` : ''}`, u);

    // a origem desvinculada volta a ser uma consolidada single-origem.
    const novo = await this.criarConsolidadaDe({ ...o, consolidadaId: null } as never, u);
    await this.recomputarStatus(novo);
    await this.limparSeVazia(antiga);
    return { ok: true, novaConsolidadaId: novo };
  }

  private async limparSeVazia(consolidadaId: string) {
    const rest = await this.prisma.vendaOrigem.count({ where: { consolidadaId } });
    if (rest === 0) {
      await this.prisma.vendaConsolidada.delete({ where: { id: consolidadaId } }).catch(() => undefined);
    } else {
      await this.recomputarStatus(consolidadaId);
    }
  }

  private async auditar(acao: string, consolidadaId: string | null, origemId: string | null, detalhe: string, u?: UsuarioLogado) {
    await this.prisma.conciliacaoAuditoria.create({
      data: { acao, consolidadaId, origemId, detalhe, usuarioId: u?.id ?? null, usuarioNome: u?.nome ?? null },
    }).catch(() => undefined);
  }

  private trintaDiasAtras(): Date {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  }

  // ==================================================================
  // CONSULTAS
  // ==================================================================

  /** Lista consolidada OU por origem, conforme filtro `origem` (PRD §4). */
  async listar(q: ListaVendasQuery) {
    const pagina = q.pagina ?? 1;
    const porPagina = q.porPagina ?? 30;
    const skip = (pagina - 1) * porPagina;

    // Visão por origem: lista os registros brutos daquele sistema.
    if (q.origem && q.origem !== 'todas') {
      const where = this.whereOrigem(q);
      const [total, itens] = await Promise.all([
        this.prisma.vendaOrigem.count({ where }),
        this.prisma.vendaOrigem.findMany({ where, orderBy: { dataHora: 'desc' }, skip, take: porPagina, include: { consolidada: { select: { numero: true, statusConciliacao: true } } } }),
      ]);
      return { modo: 'origem', total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina), itens: jsonSeguro(itens) };
    }

    // Visão consolidada.
    const where = this.whereConsolidada(q);
    const [total, itens] = await Promise.all([
      this.prisma.vendaConsolidada.count({ where }),
      this.prisma.vendaConsolidada.findMany({
        where,
        orderBy: { dataVenda: 'desc' },
        skip,
        take: porPagina,
        include: { origens: { select: { origem: true, valor: true, status: true, formaPagamento: true } } },
      }),
    ]);
    const comFlags = itens.map((v) => ({
      ...v,
      temFebrahub: v.origens.some((o) => o.origem === 'FEBRAHUB'),
      temStone: v.origens.some((o) => o.origem === 'STONE'),
      temOmie: v.origens.some((o) => o.origem === 'OMIE'),
    }));
    return { modo: 'consolidada', total, pagina, porPagina, totalPaginas: Math.ceil(total / porPagina), itens: jsonSeguro(comFlags) };
  }

  private whereConsolidada(q: ListaVendasQuery): Prisma.VendaConsolidadaWhereInput {
    const where: Prisma.VendaConsolidadaWhereInput = {};
    if (q.dataInicio || q.dataFim) {
      where.dataVenda = {};
      if (q.dataInicio) (where.dataVenda as Prisma.DateTimeFilter).gte = new Date(q.dataInicio);
      if (q.dataFim) (where.dataVenda as Prisma.DateTimeFilter).lte = new Date(q.dataFim + 'T23:59:59Z');
    }
    if (q.unidade) where.unidade = { contains: q.unidade, mode: 'insensitive' };
    if (q.evento) where.eventoNome = { contains: q.evento, mode: 'insensitive' };
    if (q.statusConciliacao) where.statusConciliacao = q.statusConciliacao;
    if (q.formaPagamento) where.formaPagamento = q.formaPagamento;
    if (q.busca) {
      where.OR = [
        { clienteNome: { contains: q.busca, mode: 'insensitive' } },
        { clienteDoc: { contains: q.busca } },
        { origens: { some: { nsu: { contains: q.busca } } } },
        { origens: { some: { tid: { contains: q.busca } } } },
        { origens: { some: { externalId: { contains: q.busca } } } },
      ];
    }
    if (q.nsu) where.origens = { some: { nsu: { contains: q.nsu } } };
    if (q.tid) where.origens = { some: { tid: { contains: q.tid } } };
    if (q.terminal) where.origens = { some: { terminal: { contains: q.terminal } } };
    return where;
  }

  private whereOrigem(q: ListaVendasQuery): Prisma.VendaOrigemWhereInput {
    const where: Prisma.VendaOrigemWhereInput = { origem: q.origem };
    if (q.dataInicio || q.dataFim) {
      where.dataHora = {};
      if (q.dataInicio) (where.dataHora as Prisma.DateTimeFilter).gte = new Date(q.dataInicio);
      if (q.dataFim) (where.dataHora as Prisma.DateTimeFilter).lte = new Date(q.dataFim + 'T23:59:59Z');
    }
    if (q.unidade) where.unidade = { contains: q.unidade, mode: 'insensitive' };
    if (q.formaPagamento) where.formaPagamento = q.formaPagamento;
    if (q.terminal) where.terminal = { contains: q.terminal };
    if (q.nsu) where.nsu = { contains: q.nsu };
    if (q.tid) where.tid = { contains: q.tid };
    if (q.autorizacao) where.autorizacao = { contains: q.autorizacao };
    if (q.busca) {
      where.OR = [
        { clienteNome: { contains: q.busca, mode: 'insensitive' } },
        { nsu: { contains: q.busca } },
        { tid: { contains: q.busca } },
        { externalId: { contains: q.busca } },
      ];
    }
    return where;
  }

  /** Detalhe completo de uma venda consolidada com os 3 blocos de origem. */
  async detalhe(id: string) {
    const vc = await this.prisma.vendaConsolidada.findUnique({
      where: { id },
      include: {
        origens: { orderBy: { origem: 'asc' } },
      },
    });
    if (!vc) throw new NotFoundException('Venda consolidada não encontrada.');

    // enriquece FebraHub com itens do pedido.
    const fh = vc.origens.find((o) => o.origem === 'FEBRAHUB');
    let itensFebrahub: unknown[] = [];
    if (fh?.lojaPedidoId) {
      const itens = await this.prisma.lojaPedidoItem.findMany({
        where: { pedidoId: fh.lojaPedidoId },
        select: { descricao: true, quantidade: true, precoUnit: true, total: true },
      });
      itensFebrahub = jsonSeguro(itens);
    }
    const auditoria = await this.prisma.conciliacaoAuditoria.findMany({
      where: { consolidadaId: id },
      orderBy: { criadoEm: 'desc' },
      take: 30,
    });
    return jsonSeguro({ ...vc, itensFebrahub, auditoria });
  }

  /** Cards do topo (PRD §20-23) + faturamento por origem (PRD §35). */
  async resumo(q: ListaVendasQuery) {
    const where = this.whereConsolidada(q);
    const [agg, porStatus, origensAgg] = await Promise.all([
      this.prisma.vendaConsolidada.aggregate({ where, _count: true, _sum: { valorTotal: true, valorRecebido: true, valorEstornado: true } }),
      this.prisma.vendaConsolidada.groupBy({ by: ['statusConciliacao'], where, _count: true, _sum: { valorTotal: true } }),
      this.prisma.vendaOrigem.groupBy({ by: ['origem'], where: this.origensNoPeriodo(q), _count: true, _sum: { valor: true } }),
    ]);

    const porStatusMap: Record<string, { count: number; valor: number }> = {};
    for (const s of porStatus) porStatusMap[s.statusConciliacao] = { count: s._count, valor: num(s._sum.valorTotal) };

    const origem: Record<string, { count: number; valor: number }> = { FEBRAHUB: { count: 0, valor: 0 }, STONE: { count: 0, valor: 0 }, OMIE: { count: 0, valor: 0 } };
    for (const o of origensAgg) origem[o.origem] = { count: o._count, valor: num(o._sum.valor) };

    const somenteStone = porStatusMap['SOMENTE_STONE'] ?? { count: 0, valor: 0 };
    // FebraHub sem Stone: consolidadas SOMENTE_FEBRAHUB (não há Stone localizado).
    const semStone = porStatusMap['SOMENTE_FEBRAHUB'] ?? { count: 0, valor: 0 };
    const divergencias = porStatusMap['DIVERGENCIA_VALOR'] ?? { count: 0, valor: 0 };
    const naoConciliado =
      (porStatusMap['REQUER_REVISAO']?.count ?? 0) +
      (porStatusMap['SOMENTE_STONE']?.count ?? 0) +
      (porStatusMap['SOMENTE_FEBRAHUB']?.count ?? 0) +
      (porStatusMap['SOMENTE_OMIE']?.count ?? 0) +
      (porStatusMap['DIVERGENCIA_VALOR']?.count ?? 0) +
      (porStatusMap['PARCIALMENTE_CONCILIADA']?.count ?? 0);

    return jsonSeguro({
      // faturamento consolidado (SEM somar origens) — PRD §20, §56.
      faturamentoConsolidado: num(agg._sum.valorTotal),
      recebido: num(agg._sum.valorRecebido),
      estornado: num(agg._sum.valorEstornado),
      totalVendas: agg._count,
      // visões por origem (NÃO somar entre si) — PRD §35.
      porOrigem: origem,
      // cards operacionais.
      somenteStone,
      febrahubSemStone: semStone,
      divergencias,
      naoConciliado,
      porStatus: porStatusMap,
    });
  }

  private origensNoPeriodo(q: ListaVendasQuery): Prisma.VendaOrigemWhereInput {
    const where: Prisma.VendaOrigemWhereInput = {};
    if (q.dataInicio || q.dataFim) {
      where.dataHora = {};
      if (q.dataInicio) (where.dataHora as Prisma.DateTimeFilter).gte = new Date(q.dataInicio);
      if (q.dataFim) (where.dataHora as Prisma.DateTimeFilter).lte = new Date(q.dataFim + 'T23:59:59Z');
    }
    return where;
  }

  /** Status da integração Stone (PRD §49). */
  async statusIntegracao() {
    const [ultimoImport, ultimaTx, totalOrigens] = await Promise.all([
      this.prisma.stoneConciliacaoImport.findFirst({ orderBy: { atualizadoEm: 'desc' } }),
      this.prisma.vendaOrigem.findFirst({ where: { origem: 'STONE' }, orderBy: { dataHora: 'desc' } }),
      this.prisma.vendaOrigem.count({ where: { origem: 'STONE' } }),
    ]);
    return jsonSeguro({
      stone: {
        conectado: this.stone.configurado,
        ultimaSincronizacao: ultimoImport?.atualizadoEm ?? null,
        ultimoStatus: ultimoImport?.status ?? null,
        ultimaTransacao: ultimaTx?.dataHora ?? null,
        registrosImportados: totalOrigens,
        ultimoErro: ultimoImport?.erro ?? null,
      },
    });
  }

  /** Exportação CSV respeitando os filtros (PRD §40). */
  async exportarCsv(q: ListaVendasQuery): Promise<string> {
    const dados = await this.listar({ ...q, pagina: 1, porPagina: 200 });
    const linhas: string[] = [];
    if (dados.modo === 'origem') {
      linhas.push('origem;externalId;valor;data;nsu;tid;autorizacao;bandeira;formaPagamento;parcelas;terminal;status;consolidada');
      for (const o of dados.itens as Record<string, unknown>[]) {
        const c = (o as { consolidada?: { numero?: number } }).consolidada;
        linhas.push([
          o.origem, o.externalId, o.valor, o.dataHora, o.nsu ?? '', o.tid ?? '', o.autorizacao ?? '',
          o.bandeira ?? '', o.formaPagamento ?? '', o.parcelas ?? '', o.terminal ?? '', o.status,
          c?.numero ? `VC-${String(c.numero).padStart(6, '0')}` : '',
        ].map(csvCampo).join(';'));
      }
    } else {
      linhas.push('venda;data;cliente;unidade;evento;valorTotal;recebido;formaPagamento;status;febrahub;stone;omie');
      for (const v of dados.itens as Record<string, unknown>[]) {
        linhas.push([
          `VC-${String(v.numero).padStart(6, '0')}`, v.dataVenda, v.clienteNome ?? '', v.unidade ?? '', v.eventoNome ?? '',
          v.valorTotal, v.valorRecebido, v.formaPagamento ?? '', v.statusConciliacao,
          v.temFebrahub ? 'X' : '', v.temStone ? 'X' : '', v.temOmie ? 'X' : '',
        ].map(csvCampo).join(';'));
      }
    }
    return linhas.join('\n');
  }
}

function csvCampo(v: unknown): string {
  const s = v == null ? '' : String(v);
  return /[;\n"]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
