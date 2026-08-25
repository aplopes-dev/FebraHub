import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import * as QRCode from 'qrcode';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LojaPedidosEventos } from './loja-pedidos.eventos';
import { PagamentosService } from './pagamentos/pagamentos.service';
import type { FormaPagamento } from './pagamentos/payment-provider';
import {
  CancelarPedidoDto, CheckoutDto, ConfirmarPagamentoDto, IniciarPagamentoDto, SalvarOperacaoDto, VendaPdvDto,
} from './loja-pedidos.dto';

const D = (n: number | string) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

const opera = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('pdv.operar') || u.permissoes.includes('loja.pedidos.operar');
const gerencia = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('loja.produtos.gerenciar') || u.permissoes.includes('loja.pedidos.gerenciar');

/** Régua de WhatsApp da Loja — a mensagem certa em cada transição relevante. */
function mensagemRegua(evento: 'confirmado' | 'proximo' | 'preparacao' | 'pronto', numero: number, posicao?: number | null): string {
  switch (evento) {
    case 'confirmado':
      return `✅ Pagamento confirmado!\n\nPedido #${numero}.` +
        (posicao ? `\n\nPosição atual na fila: ${posicao}.` : '') +
        `\n\nAvisaremos quando estiver chegando sua vez.`;
    case 'proximo':
      return `🔔 VOCÊ É O PRÓXIMO!\n\nPedido #${numero}.\n\nPor favor, dirija-se ao balcão da Loja FEBRACIS. Seu pedido será preparado em instantes.`;
    case 'preparacao':
      return `🛍️ Pedido #${numero} em preparação.\n\nNossa equipe já está preparando seu pedido.`;
    case 'pronto':
      return `🎉 PEDIDO #${numero} PRONTO!\n\nSeu pedido está disponível para retirada no balcão da Loja FEBRACIS.`;
  }
}

@Injectable()
export class LojaPedidosService {
  private readonly logger = new Logger(LojaPedidosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: LojaPedidosEventos,
    private readonly whatsapp: WhatsappService,
    private readonly pagamentos: PagamentosService,
  ) {}

  // ==================== OPERAÇÕES / EVENTOS ====================

  async listarOperacoes() {
    return jsonSeguro(await this.prisma.lojaOperacao.findMany({
      orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      include: { _count: { select: { pedidos: true } } },
    }));
  }

  async operacaoAtiva() {
    return this.prisma.lojaOperacao.findFirst({ where: { status: 'ativa' }, orderBy: { criadoEm: 'desc' } });
  }

  /** Base pública do app (para as URLs do cardápio/TV). Prioriza FRONTEND_URL,
   *  cai em APP_URL; sem env, aceita a origem passada pela tela. */
  private basePublica(origem?: string): string {
    const bruto = process.env.FRONTEND_URL || process.env.APP_URL || origem || '';
    return bruto.replace(/\/$/, '');
  }

  /** QR Code do CARDÁPIO da operação (PRD §11). Aponta direto para a URL
   *  pública `${base}/cardapio/:slug` — é o QR do cardápio, não "do evento".
   *  Devolve a URL, o dataURL PNG (para <img>/download) e o SVG (impressão
   *  nítida em banner/mesa). Não expõe nada sensível: é uma rota de leitura. */
  async qrCodeCardapio(slug: string, origem?: string) {
    const operacao = await this.prisma.lojaOperacao.findUnique({ where: { slug } });
    if (!operacao) throw new NotFoundException('Operação não encontrada para este slug.');
    const base = this.basePublica(origem);
    if (!base) throw new BadRequestException('URL pública não configurada (defina FRONTEND_URL ou APP_URL).');
    const url = `${base}/cardapio/${slug}`;
    const opcoes = { errorCorrectionLevel: 'M' as const, margin: 2, width: 512 };
    const [pngDataUrl, svg] = await Promise.all([
      QRCode.toDataURL(url, opcoes),
      QRCode.toString(url, { ...opcoes, type: 'svg' }),
    ]);
    return { slug, operacao: operacao.nome, url, pngDataUrl, svg };
  }

  async salvarOperacao(dto: SalvarOperacaoDto, u: UsuarioLogado, id?: string) {
    if (!gerencia(u)) throw new ForbiddenException('Seu perfil não pode gerenciar operações da Loja.');
    const slug = dto.slug ? dto.slug.trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') : undefined;
    const data = {
      nome: dto.nome.trim(),
      descricao: dto.descricao ?? '',
      modo: dto.modo ?? 'RETIRADA_BALCAO',
      status: dto.status ?? 'ativa',
      slug: slug || null,
      inicio: dto.inicio ? new Date(dto.inicio) : null,
      fim: dto.fim ? new Date(dto.fim) : null,
    };
    try {
      const antes = id ? await this.prisma.lojaOperacao.findUnique({ where: { id } }) : null;
      const op = id
        ? await this.prisma.lojaOperacao.update({ where: { id }, data })
        : await this.prisma.lojaOperacao.create({ data });
      void this.auditar({ entidade: 'operacao', entidadeId: op.id, acao: id ? 'config.alterada' : 'config.criada', origem: 'operador', antes: antes ?? undefined, depois: op }, u);
      return jsonSeguro(op);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throw new ConflictException('Já existe uma operação com esse slug.');
      }
      throw e;
    }
  }

  // ==================== CARDÁPIO PÚBLICO ====================

  /** Catálogo público de uma operação (por slug). Só produtos ativos, com
   *  exibe_cardapio=true. Não expõe custo. Saldo disponível = físico − reservado. */
  async cardapioPublico(slug: string) {
    const operacao = await this.prisma.lojaOperacao.findUnique({ where: { slug } });
    if (!operacao || operacao.status !== 'ativa') throw new NotFoundException('Cardápio indisponível.');
    const produtos = await this.prisma.lojaProduto.findMany({
      where: { ativo: true, exibeCardapio: true },
      include: { saldos: { where: { local: 'LOJA' } }, categoria: { select: { nome: true, cor: true, ordem: true } } },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
    });
    return jsonSeguro({
      operacao: { id: operacao.id, nome: operacao.nome, modo: operacao.modo, slug: operacao.slug },
      produtos: produtos.map((p) => {
        const saldo = p.saldos[0];
        const disponivel = Number(saldo?.saldoFisico ?? 0) - Number(saldo?.reservado ?? 0);
        return {
          produtoId: p.id, nome: p.nome, descricao: p.descricao, preco: Number(p.preco),
          imagemUrl: p.imagemUrl ?? null, categoria: p.categoria?.nome ?? null, categoriaCor: p.categoria?.cor ?? null,
          precisaPreparacao: p.precisaPreparacao,
          disponivel: p.controlaEstoque ? Math.max(0, disponivel) : null,
          esgotado: p.controlaEstoque && disponivel <= 0,
        };
      }),
    });
  }

  // ==================== CHECKOUT ====================

  /** Cria o pedido a partir de produto+quantidade. O backend recalcula preço,
   *  valida estoque e RESERVA o saldo. Não confia em preço/total do cliente. */
  async checkout(dto: CheckoutDto) {
    if (!dto.itens.length) throw new BadRequestException('Carrinho vazio.');

    // Resolve operação (a informada, ou a ativa mais recente).
    const operacao = dto.operacaoId
      ? await this.prisma.lojaOperacao.findUnique({ where: { id: dto.operacaoId } })
      : await this.prisma.lojaOperacao.findFirst({ where: { status: 'ativa' }, orderBy: { criadoEm: 'desc' } });
    if (!operacao) throw new BadRequestException('Nenhuma operação da Loja está ativa.');
    if (operacao.status !== 'ativa') throw new BadRequestException('Esta operação não está aberta.');

    return this.prisma.$transaction(async (tx) => {
      // 1) Carrega produtos e valida estoque disponível (físico − reservado).
      let subtotal = 0;
      let precisaPreparacao = false;
      const linhas: { produtoId: string; descricao: string; quantidade: number; precoUnit: number; total: number; observacao: string; controla: boolean }[] = [];

      for (const it of dto.itens) {
        const produto = await tx.lojaProduto.findUnique({
          where: { id: it.produtoId },
          include: { saldos: { where: { local: 'LOJA' } } },
        });
        if (!produto || !produto.ativo) throw new BadRequestException(`Produto indisponível no carrinho.`);
        if (produto.controlaEstoque) {
          const saldo = produto.saldos[0];
          const disponivel = Number(saldo?.saldoFisico ?? 0) - Number(saldo?.reservado ?? 0);
          if (it.quantidade > disponivel) {
            throw new ConflictException(`Estoque insuficiente para "${produto.nome}" (disponível: ${disponivel}).`);
          }
        }
        const preco = Number(produto.preco);
        const total = +(preco * it.quantidade).toFixed(2);
        subtotal += total;
        if (produto.precisaPreparacao) precisaPreparacao = true;
        linhas.push({
          produtoId: produto.id, descricao: produto.nome, quantidade: it.quantidade,
          precoUnit: preco, total, observacao: it.observacao ?? '', controla: produto.controlaEstoque,
        });
      }
      subtotal = +subtotal.toFixed(2);

      // 2) Numeração pública sequencial por operação, sem race (advisory lock).
      const numero = await this.proximoNumero(tx, operacao.id);

      // 3) Cria o pedido + itens.
      const pedido = await tx.lojaPedido.create({
        data: {
          numero, operacaoId: operacao.id, canal: dto.canal ?? 'CARDAPIO_DIGITAL',
          status: 'AGUARDANDO_PAGAMENTO',
          clienteNome: dto.clienteNome ?? '', clienteTel: dto.clienteTel ? dto.clienteTel.replace(/\D/g, '') : null,
          subtotal: D(subtotal), desconto: D(0), total: D(subtotal),
          precisaPreparacao, observacoes: dto.observacoes ?? '',
          itens: { create: linhas.map((l) => ({ produtoId: l.produtoId, descricao: l.descricao, quantidade: D(l.quantidade), precoUnit: D(l.precoUnit), total: D(l.total), observacao: l.observacao })) },
          historico: { create: { paraStatus: 'AGUARDANDO_PAGAMENTO', origem: dto.canal === 'PDV' ? 'operador' : 'cliente', observacao: 'Pedido criado' } },
        },
        include: { itens: true },
      });

      // 4) RESERVA de estoque (não baixa ainda) + ledger de reserva.
      for (const l of linhas) {
        if (!l.controla) continue;
        await tx.lojaEstoqueSaldo.upsert({
          where: { produtoId_local: { produtoId: l.produtoId, local: 'LOJA' } },
          create: { produtoId: l.produtoId, local: 'LOJA', reservado: D(l.quantidade) },
          update: { reservado: { increment: D(l.quantidade) } },
        });
        await tx.lojaEstoqueMovimento.create({
          data: { produtoId: l.produtoId, local: 'LOJA', tipo: 'reserva', quantidade: D(l.quantidade), origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Reserva pedido #${pedido.numero}` },
        });
      }

      this.eventos.emitir({ tipo: 'pedido', operacaoId: operacao.id, pedidoId: pedido.id });
      return jsonSeguro(pedido);
    });
  }

  /** Contador transacional de número público por operação. */
  private async proximoNumero(tx: Prisma.TransactionClient, operacaoId: string): Promise<number> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`loja_ped_${operacaoId}`}))`;
    const linha = await tx.lojaNumeracaoPedido.upsert({
      where: { operacaoId },
      create: { operacaoId, ultimo: 1001 },
      update: { ultimo: { increment: 1 } },
    });
    return linha.ultimo;
  }

  // ==================== PAGAMENTO ====================

  /** Cria a cobrança no provider ativo (ASAAS se configurado, senão manual) e
   *  grava o pagamento PENDENTE com os dados do PIX/gateway. A confirmação vem
   *  depois: por WEBHOOK (ASAAS) ou pelo OPERADOR (manual/maquininha). */
  async iniciarPagamento(pedidoId: string, dto: IniciarPagamentoDto) {
    const pedido = await this.prisma.lojaPedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    if (pedido.status !== 'AGUARDANDO_PAGAMENTO') throw new BadRequestException('Este pedido não está aguardando pagamento.');

    const provider = this.pagamentos.provider();

    // Cria primeiro o registro (para termos o pagamentoId como externalReference).
    const pagamento = await this.prisma.lojaPedidoPagamento.create({
      data: { pedidoId, provider: provider.nome, forma: dto.forma, status: 'PENDENTE', valor: pedido.total },
    });

    try {
      const cobranca = await provider.criarCobranca({
        pagamentoId: pagamento.id, pedidoNumero: pedido.numero, forma: dto.forma as FormaPagamento,
        valor: Number(pedido.total), clienteNome: pedido.clienteNome, clienteTel: pedido.clienteTel, expiraMin: 30,
      });
      const atualizado = await this.prisma.lojaPedidoPagamento.update({
        where: { id: pagamento.id },
        data: {
          gatewayId: cobranca.gatewayId ?? undefined,
          gatewayPayload: cobranca.payload === undefined ? undefined : (jsonSeguro(cobranca.payload) as Prisma.InputJsonValue),
          pixQrcode: cobranca.pixQrcode ?? undefined,
          pixCopiaCola: cobranca.pixCopiaCola ?? undefined,
          pixExpiracao: cobranca.pixExpiracao ?? undefined,
        },
      });
      return jsonSeguro(atualizado);
    } catch (e) {
      // Falhou no gateway: marca o pagamento como recusado e propaga um erro
      // amigável — o pedido continua AGUARDANDO_PAGAMENTO (dá p/ tentar de novo).
      await this.prisma.lojaPedidoPagamento.update({ where: { id: pagamento.id }, data: { status: 'RECUSADO' } }).catch(() => undefined);
      throw e;
    }
  }

  /** Confirmação PÚBLICA (sem sessão) — só permitida quando NÃO há gateway
   *  externo ativo (dev/homolog). Com ASAAS configurado, a confirmação só vem
   *  por webhook assinado ou pelo operador autenticado — fechando o furo de
   *  alguém "confirmar sozinho" um pagamento via rota aberta. */
  async confirmarPagamentoPublico(pedidoId: string, dto: ConfirmarPagamentoDto) {
    if (this.pagamentos.usaGatewayExterno) {
      throw new ForbiddenException('Confirmação pública desabilitada: o pagamento é confirmado pelo gateway.');
    }
    return this.confirmarPagamento(pedidoId, dto, 'webhook');
  }

  /** Webhook do gateway: confirma o pagamento de forma idempotente. Encontra o
   *  pagamento pelo gateway_id, e só age quando o status vira CONFIRMADO. Um
   *  reenvio do mesmo evento não confirma duas vezes (o confirmarPagamento já
   *  é idempotente por pedido). */
  async processarWebhook(providerNome: string, payload: unknown): Promise<{ ok: boolean; tratado: boolean }> {
    const provider = this.pagamentos.porNome(providerNome);
    const evento = provider.interpretarWebhook(payload);
    if (!evento) return { ok: true, tratado: false };

    void this.auditar({ entidade: 'pagamento', acao: 'webhook.recebido', origem: 'webhook', depois: { gatewayId: evento.gatewayId, status: evento.status } });

    const pagamento = await this.prisma.lojaPedidoPagamento.findFirst({ where: { gatewayId: evento.gatewayId } });
    if (!pagamento) {
      this.logger.warn(`Webhook ${providerNome}: pagamento com gatewayId=${evento.gatewayId} não encontrado.`);
      return { ok: true, tratado: false };
    }

    if (evento.status === 'CONFIRMADO') {
      await this.confirmarPagamento(pagamento.pedidoId, { pagamentoId: pagamento.id, gatewayId: evento.gatewayId }, 'webhook');
      return { ok: true, tratado: true };
    }
    if (['EXPIRADO', 'RECUSADO', 'ESTORNADO'].includes(evento.status)) {
      await this.prisma.lojaPedidoPagamento.update({ where: { id: pagamento.id }, data: { status: evento.status } }).catch(() => undefined);
      return { ok: true, tratado: true };
    }
    return { ok: true, tratado: false };
  }

  /** Confirma o pagamento: baixa o estoque reservado, gera recebível no
   *  Financeiro, coloca na fila (se precisa preparação) ou marca entregue, e
   *  dispara o WhatsApp de confirmação. Idempotente por pagamento. */
  async confirmarPagamento(pedidoId: string, dto: ConfirmarPagamentoDto, origem: 'operador' | 'webhook', u?: UsuarioLogado) {
    if (origem === 'operador' && (!u || !opera(u))) throw new ForbiddenException('Seu perfil não pode confirmar pagamentos.');

    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.lojaPedido.findUnique({ where: { id: pedidoId }, include: { itens: true, operacao: true } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (pedido.status === 'CANCELADO') throw new BadRequestException('Pedido cancelado.');
      if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        // Já confirmado antes — idempotente, devolve como está.
        return { pedido: jsonSeguro(pedido), jaConfirmado: true, posicao: pedido.posicaoFila };
      }

      // Marca o pagamento como confirmado (o informado, ou o mais recente pendente).
      const pagamento = dto.pagamentoId
        ? await tx.lojaPedidoPagamento.findUnique({ where: { id: dto.pagamentoId } })
        : await tx.lojaPedidoPagamento.findFirst({ where: { pedidoId, status: 'PENDENTE' }, orderBy: { criadoEm: 'desc' } });
      if (!pagamento) throw new BadRequestException('Nenhum pagamento pendente para este pedido.');
      await tx.lojaPedidoPagamento.update({
        where: { id: pagamento.id },
        data: { status: 'CONFIRMADO', confirmadoEm: new Date(), gatewayId: dto.gatewayId ?? pagamento.gatewayId },
      });

      // Baixa o estoque reservado → físico (converte reserva em saída).
      for (const it of pedido.itens) {
        const produto = await tx.lojaProduto.findUnique({ where: { id: it.produtoId }, include: { saldos: { where: { local: 'LOJA' } } } });
        if (!produto || !produto.controlaEstoque) continue;
        const saldo = produto.saldos[0];
        const saldoFisico = Number(saldo?.saldoFisico ?? 0);
        const qtd = Number(it.quantidade);
        await tx.lojaEstoqueSaldo.update({
          where: { produtoId_local: { produtoId: it.produtoId, local: 'LOJA' } },
          data: { saldoFisico: { decrement: it.quantidade }, reservado: { decrement: it.quantidade } },
        });
        await tx.lojaEstoqueMovimento.create({
          data: { produtoId: it.produtoId, local: 'LOJA', tipo: 'saida', quantidade: it.quantidade, saldoApos: D(saldoFisico - qtd), origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Venda pedido #${pedido.numero}`, usuarioId: u?.id },
        });
      }

      // Recebível no Financeiro (venda à vista, já paga).
      const [contaVenda, centroComercial] = await Promise.all([
        tx.financeiroPlanoConta.findFirst({ where: { disponivelPdv: true } }),
        tx.financeiroCentroCusto.findFirst({ where: { nome: 'Comercial' } }),
      ]);
      const lanc = await tx.financeiroLancamento.create({
        data: {
          operacao: 'receber', descricao: `Pedido Loja #${pedido.numero}`, valor: pedido.total, valorPago: pedido.total,
          situacao: 'pago', dataCompetencia: new Date(), dataVencimento: new Date(), pagoEm: new Date(),
          contraparte: pedido.clienteNome || 'Consumidor', formaPagamento: pagamento.forma, origem: 'pdv', criadoPorId: u?.id,
          ...(contaVenda && centroComercial ? { rateios: { create: [{ planoContaId: contaVenda.id, centroCustoId: centroComercial.id, valor: pedido.total, percentual: D(100) }] } } : {}),
        },
      });

      // Próximo estado: fila (se precisa preparo) ou já pronto p/ retirada.
      let posicao: number | null = null;
      let novoStatus: string;
      if (pedido.precisaPreparacao) {
        posicao = await this.calcularPosicaoFila(tx, pedido.operacaoId);
        novoStatus = 'NA_FILA';
      } else {
        novoStatus = 'PRONTO';
      }

      const atualizado = await tx.lojaPedido.update({
        where: { id: pedido.id },
        data: {
          status: novoStatus, lancamentoId: lanc.id, confirmadoEm: new Date(),
          ...(novoStatus === 'NA_FILA' ? { entrouFilaEm: new Date(), posicaoFila: posicao } : { prontoEm: new Date() }),
          historico: { create: [
            { deStatus: 'AGUARDANDO_PAGAMENTO', paraStatus: 'PAGAMENTO_CONFIRMADO', origem, usuarioId: u?.id, observacao: `Pagamento ${pagamento.forma} confirmado` },
            { deStatus: 'PAGAMENTO_CONFIRMADO', paraStatus: novoStatus, origem, usuarioId: u?.id },
          ] },
        },
        include: { itens: true, operacao: true },
      });
      return { pedido: jsonSeguro(atualizado), jaConfirmado: false, posicao };
    });

    if (!resultado.jaConfirmado) {
      const p = resultado.pedido as unknown as { id: string; numero: number; operacaoId: string | null; clienteTel: string | null; total: string };
      this.eventos.emitir({ tipo: 'fila', operacaoId: p.operacaoId ?? undefined });
      this.eventos.emitir({ tipo: 'pedido', pedidoId: p.id });
      void this.avisar(p.clienteTel, mensagemRegua('confirmado', p.numero, resultado.posicao));
      void this.auditar({ entidade: 'pedido', entidadeId: p.id, acao: 'pagamento.confirmado', origem, depois: { numero: p.numero, total: p.total } }, u);
    }
    return resultado.pedido;
  }

  /** Posição na fila = quantos pedidos ativos (NA_FILA/PROXIMO/EM_PREPARACAO)
   *  já existem na operação + 1. */
  private async calcularPosicaoFila(tx: Prisma.TransactionClient, operacaoId: string | null): Promise<number> {
    const ativos = await tx.lojaPedido.count({
      where: { operacaoId, status: { in: ['NA_FILA', 'PROXIMO', 'EM_PREPARACAO'] } },
    });
    return ativos + 1;
  }

  // ==================== VENDA PDV (fila unificada + split) ====================

  /**
   * Venda no balcão pela FILA UNIFICADA (PRD §36-38). Diferente do checkout do
   * cardápio, a venda do PDV já nasce PAGA (o operador recebeu na hora) e vai
   * direto para o próximo estado: ENTREGAR_AGORA → RETIRADO, ou
   * ENVIAR_PREPARACAO → NA_FILA. Baixa o MESMO estoque (loja_estoque_saldos) e
   * alimenta o MESMO Financeiro. Suporta SPLIT: várias formas somando o total.
   */
  async vendaPdv(dto: VendaPdvDto, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode operar o PDV.');
    if (!dto.itens.length) throw new BadRequestException('Venda sem itens.');

    const operacao = dto.operacaoId
      ? await this.prisma.lojaOperacao.findUnique({ where: { id: dto.operacaoId } })
      : await this.prisma.lojaOperacao.findFirst({ where: { status: 'ativa' }, orderBy: { criadoEm: 'desc' } });
    if (!operacao) throw new BadRequestException('Nenhuma operação da Loja está ativa.');

    const resultado = await this.prisma.$transaction(async (tx) => {
      // 1) Valida itens + estoque disponível e calcula subtotal.
      let subtotal = 0;
      let precisaPreparacao = false;
      const linhas: { produtoId: string; descricao: string; quantidade: number; precoUnit: number; total: number; observacao: string; controla: boolean; saldoFisico: number }[] = [];
      for (const it of dto.itens) {
        const produto = await tx.lojaProduto.findUnique({ where: { id: it.produtoId }, include: { saldos: { where: { local: 'LOJA' } } } });
        if (!produto || !produto.ativo) throw new BadRequestException('Produto indisponível na venda.');
        const saldo = produto.saldos[0];
        const saldoFisico = Number(saldo?.saldoFisico ?? 0);
        if (produto.controlaEstoque) {
          const disponivel = saldoFisico - Number(saldo?.reservado ?? 0);
          if (it.quantidade > disponivel) throw new ConflictException(`Estoque insuficiente para "${produto.nome}" (disponível: ${disponivel}).`);
        }
        const preco = Number(produto.preco);
        const total = +(preco * it.quantidade).toFixed(2);
        subtotal += total;
        if (produto.precisaPreparacao) precisaPreparacao = true;
        linhas.push({ produtoId: produto.id, descricao: produto.nome, quantidade: it.quantidade, precoUnit: preco, total, observacao: it.observacao ?? '', controla: produto.controlaEstoque, saldoFisico });
      }
      subtotal = +subtotal.toFixed(2);
      const desconto = Math.min(dto.desconto ?? 0, subtotal);
      const total = +(subtotal - desconto).toFixed(2);

      // 2) Split: as formas precisam somar o total.
      const pago = +dto.pagamentos.reduce((s, p) => s + p.valor, 0).toFixed(2);
      if (Math.abs(pago - total) > 0.01) {
        throw new BadRequestException(`O split de pagamentos (${pago.toFixed(2)}) não fecha com o total da venda (${total.toFixed(2)}).`);
      }

      // 3) Estado final conforme o modo do operador.
      const enviarPreparacao = dto.modo === 'ENVIAR_PREPARACAO' && precisaPreparacao;
      const numero = await this.proximoNumero(tx, operacao.id);
      let posicao: number | null = null;
      let status: string;
      if (enviarPreparacao) { posicao = await this.calcularPosicaoFila(tx, operacao.id); status = 'NA_FILA'; }
      else status = 'RETIRADO';

      // 4) Baixa de estoque (venda paga baixa direto do físico) + ledger.
      for (const l of linhas) {
        if (!l.controla) continue;
        await tx.lojaEstoqueSaldo.upsert({
          where: { produtoId_local: { produtoId: l.produtoId, local: 'LOJA' } },
          create: { produtoId: l.produtoId, local: 'LOJA', saldoFisico: D(Math.max(0, l.saldoFisico - l.quantidade)) },
          update: { saldoFisico: { decrement: D(l.quantidade) } },
        });
        await tx.lojaEstoqueMovimento.create({
          data: { produtoId: l.produtoId, local: 'LOJA', tipo: 'saida', quantidade: D(l.quantidade), saldoApos: D(l.saldoFisico - l.quantidade), origem: 'pdv', referenciaId: `PDV-${numero}`, observacao: `Venda PDV #${numero} - ${l.descricao}`, usuarioId: u.id },
        });
      }

      // 5) Recebível único no Financeiro (formas do split concatenadas).
      const [contaVenda, centroComercial] = await Promise.all([
        tx.financeiroPlanoConta.findFirst({ where: { disponivelPdv: true } }),
        tx.financeiroCentroCusto.findFirst({ where: { nome: 'Comercial' } }),
      ]);
      const lanc = await tx.financeiroLancamento.create({
        data: {
          operacao: 'receber', descricao: `Venda PDV Loja #${numero}`, valor: D(total), valorPago: D(total),
          situacao: 'pago', dataCompetencia: new Date(), dataVencimento: new Date(), pagoEm: new Date(),
          contraparte: dto.clienteNome || 'Consumidor', formaPagamento: dto.pagamentos.map((p) => p.forma).join(' + '), origem: 'pdv', criadoPorId: u.id,
          ...(contaVenda && centroComercial ? { rateios: { create: [{ planoContaId: contaVenda.id, centroCustoId: centroComercial.id, valor: D(total), percentual: D(100) }] } } : {}),
        },
      });

      // 6) Pedido + itens + N pagamentos (split) CONFIRMADOS + auditoria.
      const agora = new Date();
      const pedido = await tx.lojaPedido.create({
        data: {
          numero, operacaoId: operacao.id, canal: 'PDV', status,
          clienteNome: dto.clienteNome ?? '', clienteTel: dto.clienteTel ? dto.clienteTel.replace(/\D/g, '') : null,
          operadorId: u.id, operadorNome: u.nome,
          subtotal: D(subtotal), desconto: D(desconto), total: D(total),
          precisaPreparacao, posicaoFila: posicao, lancamentoId: lanc.id,
          confirmadoEm: agora, ...(enviarPreparacao ? { entrouFilaEm: agora } : { prontoEm: agora, retiradoEm: agora }),
          observacoes: dto.observacoes ?? '',
          itens: { create: linhas.map((l) => ({ produtoId: l.produtoId, descricao: l.descricao, quantidade: D(l.quantidade), precoUnit: D(l.precoUnit), total: D(l.total), observacao: l.observacao })) },
          pagamentos: { create: dto.pagamentos.map((p) => ({ provider: 'manual', forma: p.forma, status: 'CONFIRMADO', valor: D(p.valor), confirmadoEm: agora })) },
          historico: { create: [
            { paraStatus: 'PAGAMENTO_CONFIRMADO', origem: 'operador', usuarioId: u.id, observacao: `Venda PDV (split: ${dto.pagamentos.map((p) => p.forma).join(', ')})` },
            { deStatus: 'PAGAMENTO_CONFIRMADO', paraStatus: status, origem: 'operador', usuarioId: u.id, observacao: enviarPreparacao ? 'Enviado para preparação' : 'Entregue no balcão' },
          ] },
        },
        include: { itens: true, pagamentos: true },
      });
      return { pedido: jsonSeguro(pedido), operacaoId: operacao.id, enviarPreparacao };
    });

    this.eventos.emitir({ tipo: 'fila', operacaoId: resultado.operacaoId });
    const pv = resultado.pedido as unknown as { id: string; numero: number; total: string };
    void this.auditar({ entidade: 'pedido', entidadeId: pv.id, acao: 'pdv.venda', origem: 'operador', depois: { numero: pv.numero, total: pv.total, modo: dto.modo, split: dto.pagamentos.map((p) => p.forma) } }, u);
    return resultado.pedido;
  }

  // ==================== TRANSIÇÕES OPERACIONAIS (fila) ====================

  private async transicionar(pedidoId: string, de: string[], para: string, u: UsuarioLogado, campoData?: string) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode operar a fila da Loja.');
    const pedido = await this.prisma.lojaPedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');
    if (!de.includes(pedido.status)) throw new BadRequestException(`Transição inválida a partir de ${pedido.status}.`);
    const atualizado = await this.prisma.lojaPedido.update({
      where: { id: pedidoId },
      data: {
        status: para,
        ...(campoData ? { [campoData]: new Date() } : {}),
        historico: { create: { deStatus: pedido.status, paraStatus: para, origem: 'operador', usuarioId: u.id } },
      },
      include: { itens: true },
    });
    this.eventos.emitir({ tipo: 'fila', operacaoId: pedido.operacaoId ?? undefined });
    this.eventos.emitir({ tipo: 'pedido', pedidoId });
    return { pedido: atualizado, anterior: pedido };
  }

  async marcarProximo(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['NA_FILA'], 'PROXIMO', u);
    void this.avisar(pedido.clienteTel, mensagemRegua('proximo', pedido.numero));
    return jsonSeguro(pedido);
  }

  async iniciarPreparacao(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['NA_FILA', 'PROXIMO'], 'EM_PREPARACAO', u, 'preparacaoEm');
    void this.avisar(pedido.clienteTel, mensagemRegua('preparacao', pedido.numero));
    return jsonSeguro(pedido);
  }

  async marcarPronto(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['EM_PREPARACAO', 'PROXIMO', 'NA_FILA'], 'PRONTO', u, 'prontoEm');
    void this.avisar(pedido.clienteTel, mensagemRegua('pronto', pedido.numero));
    return jsonSeguro(pedido);
  }

  async confirmarRetirada(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['PRONTO', 'EM_PREPARACAO'], 'RETIRADO', u, 'retiradoEm');
    void this.auditar({ entidade: 'pedido', entidadeId: pedido.id, acao: 'pedido.retirado', origem: 'operador', depois: { numero: pedido.numero } }, u);
    return jsonSeguro(pedido);
  }

  /** Cancela: devolve reserva (se ainda não pago) e estorna recebível (se pago). */
  async cancelar(pedidoId: string, dto: CancelarPedidoDto, u: UsuarioLogado) {
    if (!gerencia(u)) throw new ForbiddenException('Cancelar pedido exige permissão de gestão.');
    return this.prisma.$transaction(async (tx) => {
      const pedido = await tx.lojaPedido.findUnique({ where: { id: pedidoId }, include: { itens: true } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (pedido.status === 'CANCELADO') throw new BadRequestException('Pedido já cancelado.');
      if (pedido.status === 'RETIRADO') throw new BadRequestException('Pedido já retirado — não pode ser cancelado.');

      const jaPago = !!pedido.confirmadoEm;
      for (const it of pedido.itens) {
        const produto = await tx.lojaProduto.findUnique({ where: { id: it.produtoId } });
        if (!produto || !produto.controlaEstoque) continue;
        if (jaPago) {
          // já saiu do estoque: devolve saldo físico
          await tx.lojaEstoqueSaldo.update({ where: { produtoId_local: { produtoId: it.produtoId, local: 'LOJA' } }, data: { saldoFisico: { increment: it.quantidade } } });
          await tx.lojaEstoqueMovimento.create({ data: { produtoId: it.produtoId, local: 'LOJA', tipo: 'devolucao', quantidade: it.quantidade, origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Cancelamento pedido #${pedido.numero}`, usuarioId: u.id } });
        } else {
          // ainda reservado: libera a reserva
          await tx.lojaEstoqueSaldo.update({ where: { produtoId_local: { produtoId: it.produtoId, local: 'LOJA' } }, data: { reservado: { decrement: it.quantidade } } });
          await tx.lojaEstoqueMovimento.create({ data: { produtoId: it.produtoId, local: 'LOJA', tipo: 'liberacao', quantidade: it.quantidade, origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Liberação reserva pedido #${pedido.numero}`, usuarioId: u.id } });
        }
      }
      if (pedido.lancamentoId) {
        await tx.financeiroLancamento.updateMany({ where: { id: pedido.lancamentoId, excluidoEm: null }, data: { excluidoEm: new Date() } });
      }
      await tx.lojaPedidoPagamento.updateMany({ where: { pedidoId, status: 'PENDENTE' }, data: { status: 'EXPIRADO' } });
      const atualizado = await tx.lojaPedido.update({
        where: { id: pedidoId },
        data: { status: 'CANCELADO', canceladoEm: new Date(), motivoCancel: dto.motivo, posicaoFila: null,
          historico: { create: { deStatus: pedido.status, paraStatus: 'CANCELADO', origem: 'operador', usuarioId: u.id, observacao: dto.motivo } } },
      });
      await this.auditar(
        { entidade: 'pedido', entidadeId: pedidoId, acao: jaPago ? 'pedido.estornado' : 'pedido.cancelado', origem: 'operador', antes: { status: pedido.status, total: pedido.total }, depois: { status: 'CANCELADO' }, observacao: dto.motivo },
        u, tx,
      );
      this.eventos.emitir({ tipo: 'fila', operacaoId: pedido.operacaoId ?? undefined });
      return jsonSeguro(atualizado);
    });
  }

  // ==================== CONSULTAS ====================

  async listar(operacaoId?: string, status?: string) {
    return jsonSeguro(await this.prisma.lojaPedido.findMany({
      where: { ...(operacaoId ? { operacaoId } : {}), ...(status ? { status } : {}) },
      include: { itens: true, pagamentos: { orderBy: { criadoEm: 'desc' } } },
      orderBy: { criadoEm: 'desc' }, take: 200,
    }));
  }

  async obter(pedidoId: string) {
    const p = await this.prisma.lojaPedido.findUnique({
      where: { id: pedidoId },
      include: { itens: true, pagamentos: { orderBy: { criadoEm: 'desc' } }, historico: { orderBy: { criadoEm: 'asc' } }, operacao: true },
    });
    if (!p) throw new NotFoundException('Pedido não encontrado.');
    return jsonSeguro(p);
  }

  /** Estado público do pedido para a página de acompanhamento do cliente.
   *  Só o essencial — nada de dados administrativos. */
  async acompanhar(pedidoId: string) {
    const p = await this.prisma.lojaPedido.findUnique({ where: { id: pedidoId }, select: { id: true, numero: true, status: true, posicaoFila: true, precisaPreparacao: true, criadoEm: true } });
    if (!p) throw new NotFoundException('Pedido não encontrado.');
    // posição relativa: quantos à frente ainda não prontos
    let posicaoAtual = p.posicaoFila;
    if (p.status === 'NA_FILA') {
      const aFrente = await this.prisma.lojaPedido.count({ where: { status: { in: ['PROXIMO', 'EM_PREPARACAO'] } } });
      const naFilaAntes = await this.prisma.lojaPedido.count({ where: { status: 'NA_FILA', criadoEm: { lt: p.criadoEm } } });
      posicaoAtual = aFrente + naFilaAntes + 1;
    }
    return { id: p.id, numero: p.numero, status: p.status, posicao: p.status === 'NA_FILA' ? posicaoAtual : null };
  }

  /** Painel público / TV: números por status, SEM dados pessoais. */
  async painelTv(operacaoId?: string) {
    const op = operacaoId ? { operacaoId } : {};
    const pedidos = await this.prisma.lojaPedido.findMany({
      where: { ...op, status: { in: ['NA_FILA', 'PROXIMO', 'EM_PREPARACAO', 'PRONTO'] } },
      select: { numero: true, status: true, prontoEm: true, entrouFilaEm: true },
      orderBy: { numero: 'asc' },
    });
    const so = (s: string) => pedidos.filter((p) => p.status === s).map((p) => p.numero);
    return {
      naFila: so('NA_FILA'),
      proximo: so('PROXIMO'),
      emPreparacao: so('EM_PREPARACAO'),
      prontos: so('PRONTO'),
    };
  }

  async indicadores(operacaoId?: string) {
    const hoje = new Date(); hoje.setUTCHours(0, 0, 0, 0);
    const op = operacaoId ? { operacaoId } : {};
    const pagos = { ...op, confirmadoEm: { not: null }, status: { not: 'CANCELADO' } } as const;
    const [agg, aggHoje, aguardando, emPreparo, prontos] = await Promise.all([
      this.prisma.lojaPedido.aggregate({ _sum: { total: true }, _count: true, _avg: { total: true }, where: pagos }),
      this.prisma.lojaPedido.aggregate({ _sum: { total: true }, _count: true, where: { ...pagos, confirmadoEm: { gte: hoje } } }),
      this.prisma.lojaPedido.count({ where: { ...op, status: 'NA_FILA' } }),
      this.prisma.lojaPedido.count({ where: { ...op, status: 'EM_PREPARACAO' } }),
      this.prisma.lojaPedido.count({ where: { ...op, status: 'PRONTO' } }),
    ]);
    return {
      pedidos: agg._count, faturamento: Number(agg._sum.total ?? 0), ticketMedio: Number(agg._avg.total ?? 0),
      pedidosHoje: aggHoje._count, faturamentoHoje: Number(aggHoje._sum.total ?? 0),
      aguardandoFila: aguardando, emPreparacao: emPreparo, prontos,
    };
  }

  /** Dashboard gerencial (PRD §47): produtos mais vendidos, PIX×cartão,
   *  Cardápio×PDV e tempo médio de preparação/espera. */
  async dashboard(operacaoId?: string) {
    const op = operacaoId ? { operacaoId } : {};
    const pagos = { ...op, confirmadoEm: { not: null }, status: { not: 'CANCELADO' } } as const;

    const [maisVendidos, porForma, porCanal, prontos] = await Promise.all([
      // Itens mais vendidos (só de pedidos pagos).
      this.prisma.lojaPedidoItem.groupBy({
        by: ['descricao'], _sum: { quantidade: true, total: true },
        where: { pedido: pagos }, orderBy: { _sum: { quantidade: 'desc' } }, take: 8,
      }),
      // PIX × cartão × dinheiro (pagamentos confirmados).
      this.prisma.lojaPedidoPagamento.groupBy({
        by: ['forma'], _sum: { valor: true }, _count: true,
        where: { status: 'CONFIRMADO', ...(operacaoId ? { pedido: { operacaoId } } : {}) },
      }),
      // Cardápio × PDV.
      this.prisma.lojaPedido.groupBy({
        by: ['canal'], _sum: { total: true }, _count: true, where: pagos,
      }),
      // Tempos: confirmado→pronto (preparação) e confirmado→retirado (espera total).
      this.prisma.lojaPedido.findMany({
        where: { ...op, prontoEm: { not: null }, confirmadoEm: { not: null } },
        select: { confirmadoEm: true, preparacaoEm: true, prontoEm: true, retiradoEm: true },
        take: 200, orderBy: { prontoEm: 'desc' },
      }),
    ]);

    const mediaMin = (pares: [Date | null, Date | null][]) => {
      const difs = pares
        .filter(([a, b]) => a && b)
        .map(([a, b]) => (b!.getTime() - a!.getTime()) / 60000)
        .filter((m) => m >= 0);
      return difs.length ? +(difs.reduce((s, m) => s + m, 0) / difs.length).toFixed(1) : 0;
    };

    return {
      maisVendidos: maisVendidos.map((m) => ({ descricao: m.descricao, quantidade: Number(m._sum.quantidade ?? 0), total: Number(m._sum.total ?? 0) })),
      formas: porForma.map((f) => ({ forma: f.forma, valor: Number(f._sum.valor ?? 0), transacoes: f._count })).sort((a, b) => b.valor - a.valor),
      canais: porCanal.map((c) => ({ canal: c.canal, valor: Number(c._sum.total ?? 0), pedidos: c._count })),
      tempoMedioPreparacaoMin: mediaMin(prontos.map((p) => [p.preparacaoEm ?? p.confirmadoEm, p.prontoEm])),
      tempoMedioEsperaMin: mediaMin(prontos.map((p) => [p.confirmadoEm, p.retiradoEm])),
    };
  }

  // ==================== MANUTENÇÃO (crons) ====================

  /** Libera reservas de pedidos abandonados (AGUARDANDO_PAGAMENTO há mais que a
   *  janela). Devolve o `reservado` ao disponível e marca o pedido CANCELADO
   *  com motivo automático. Idempotente e transacional por pedido. */
  async expirarReservas(minutos = Number(process.env.LOJA_RESERVA_EXPIRA_MIN ?? 30)): Promise<number> {
    const limite = new Date(Date.now() - minutos * 60_000);
    const abandonados = await this.prisma.lojaPedido.findMany({
      where: { status: 'AGUARDANDO_PAGAMENTO', criadoEm: { lt: limite } },
      include: { itens: true },
      take: 200,
    });
    let liberados = 0;
    for (const pedido of abandonados) {
      try {
        await this.prisma.$transaction(async (tx) => {
          for (const it of pedido.itens) {
            const produto = await tx.lojaProduto.findUnique({ where: { id: it.produtoId } });
            if (!produto || !produto.controlaEstoque) continue;
            await tx.lojaEstoqueSaldo.update({
              where: { produtoId_local: { produtoId: it.produtoId, local: 'LOJA' } },
              data: { reservado: { decrement: it.quantidade } },
            }).catch(() => undefined);
            await tx.lojaEstoqueMovimento.create({
              data: { produtoId: it.produtoId, local: 'LOJA', tipo: 'liberacao', quantidade: it.quantidade, origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Reserva expirada (#${pedido.numero})` },
            });
          }
          await tx.lojaPedidoPagamento.updateMany({ where: { pedidoId: pedido.id, status: 'PENDENTE' }, data: { status: 'EXPIRADO' } });
          await tx.lojaPedido.update({
            where: { id: pedido.id },
            data: { status: 'CANCELADO', canceladoEm: new Date(), motivoCancel: 'Reserva expirada (pagamento não confirmado)',
              historico: { create: { deStatus: 'AGUARDANDO_PAGAMENTO', paraStatus: 'CANCELADO', origem: 'sistema', observacao: 'Reserva expirada' } } },
          });
        });
        liberados++;
        this.eventos.emitir({ tipo: 'fila', operacaoId: pedido.operacaoId ?? undefined });
      } catch (e) {
        this.logger.warn(`Falha ao expirar reserva do pedido #${pedido.numero}: ${String(e).slice(0, 150)}`);
      }
    }
    return liberados;
  }

  /** Lembra clientes de pedidos PRONTOS não retirados após N minutos (§32).
   *  Um lembrete por pedido: marca no histórico para não repetir. */
  async lembrarProntos(minutos = Number(process.env.LOJA_LEMBRETE_PRONTO_MIN ?? 5)): Promise<number> {
    const limite = new Date(Date.now() - minutos * 60_000);
    const prontos = await this.prisma.lojaPedido.findMany({
      where: {
        status: 'PRONTO', prontoEm: { lt: limite }, clienteTel: { not: null },
        historico: { none: { paraStatus: 'LEMBRETE_PRONTO' } },
      },
      select: { id: true, numero: true, clienteTel: true, operacaoId: true },
      take: 100,
    });
    let avisados = 0;
    for (const p of prontos) {
      const texto = `⏰ Pedido #${p.numero} continua pronto para retirada no balcão da Loja FEBRACIS. Passe aqui quando puder!`;
      await this.avisar(p.clienteTel, texto);
      // registra o lembrete para não repetir (paraStatus sintético no histórico)
      await this.prisma.lojaPedidoHistorico.create({
        data: { pedidoId: p.id, paraStatus: 'LEMBRETE_PRONTO', origem: 'sistema', observacao: `Lembrete de retirada (${minutos} min)` },
      }).catch(() => undefined);
      avisados++;
    }
    return avisados;
  }

  // ==================== AUDITORIA (PRD §48) ====================

  /** Registra um evento crítico. Best-effort: uma falha de auditoria não pode
   *  derrubar a operação que a originou. Aceita um tx opcional para participar
   *  da mesma transação do evento (atomicidade quando faz sentido). */
  async auditar(
    e: { entidade: string; entidadeId?: string | null; acao: string; origem?: string; antes?: unknown; depois?: unknown; observacao?: string },
    u?: UsuarioLogado,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const cliente = tx ?? this.prisma;
    try {
      await cliente.lojaAuditoria.create({
        data: {
          entidade: e.entidade, entidadeId: e.entidadeId ?? null, acao: e.acao,
          origem: e.origem ?? (u ? 'operador' : 'sistema'),
          usuarioId: u?.id, usuarioNome: u?.nome,
          antes: e.antes === undefined ? undefined : (jsonSeguro(e.antes) as Prisma.InputJsonValue),
          depois: e.depois === undefined ? undefined : (jsonSeguro(e.depois) as Prisma.InputJsonValue),
          observacao: e.observacao ?? '',
        },
      });
    } catch (erro) {
      this.logger.warn(`Auditoria não registrada (${e.entidade}/${e.acao}): ${String(erro).slice(0, 150)}`);
    }
  }

  /** Consulta a trilha de auditoria, por entidade/ação e período. */
  async listarAuditoria(filtros: { entidade?: string; entidadeId?: string; acao?: string; de?: string; ate?: string } = {}) {
    return jsonSeguro(await this.prisma.lojaAuditoria.findMany({
      where: {
        ...(filtros.entidade ? { entidade: filtros.entidade } : {}),
        ...(filtros.entidadeId ? { entidadeId: filtros.entidadeId } : {}),
        ...(filtros.acao ? { acao: filtros.acao } : {}),
        ...(filtros.de || filtros.ate ? { criadoEm: { ...(filtros.de ? { gte: new Date(filtros.de) } : {}), ...(filtros.ate ? { lte: new Date(filtros.ate) } : {}) } } : {}),
      },
      orderBy: { criadoEm: 'desc' }, take: 300,
    }));
  }

  // ==================== WHATSAPP (best-effort) ====================

  private async avisar(telefone: string | null, texto: string) {
    if (!telefone) return;
    try {
      const r = await this.whatsapp.enviarProativo(telefone, texto);
      if (!r.enviado) this.logger.debug(`WhatsApp não enviado (${r.motivo}) para ${telefone}`);
    } catch (e) {
      this.logger.warn(`Falha ao avisar cliente por WhatsApp: ${String(e).slice(0, 150)}`);
    }
  }
}
