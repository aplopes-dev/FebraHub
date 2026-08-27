import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, Logger, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { LojaPedidosEventos } from './loja-pedidos.eventos';
import { PagamentosService } from './pagamentos/pagamentos.service';
import type { FormaPagamento } from './pagamentos/payment-provider';
import {
  CancelarPedidoDto, CheckoutDto, ConfirmarPagamentoDto, EditarItensDto, EditarItensPublicoDto, IniciarPagamentoDto, MoverStatusDto, SalvarOperacaoDto, VendaPdvDto,
} from './loja-pedidos.dto';
import { ImpressoraService } from './impressora.service';
import { montarCupom } from './cupom-escpos';
// Regras PURAS extraídas do service (testadas em regras/*.spec.ts). O service
// mantém apenas orquestração + acesso a dados; as decisões de negócio (texto da
// régua, veredito de retirada, aritmética de valores/estoque) vivem aqui.
import { fmtSenha, mensagemRegua, mensagemLembretePronto } from './regras/mensagens';
import { gerarTokenRetirada, renderizarQr, urlRetirada, avaliarRetirada } from './regras/retirada';
import {
  round2, totalLinha, descontoValido, totalComDesconto,
  disponivel as saldoDisponivel, estoqueInsuficiente, conferirSplit,
  parseCodigoRetirada, escolherCodigoRetirada, mediaMinutos,
} from './regras/calculos';

const D = (n: number | string) => new Prisma.Decimal(n);
const jsonSeguro = <T>(v: T): T =>
  JSON.parse(JSON.stringify(v, (_k, x) => (typeof x === 'bigint' ? x.toString() : x)));

const opera = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('pdv.operar') || u.permissoes.includes('loja.pedidos.operar');
const gerencia = (u: UsuarioLogado) => u.papel === 'admin' || u.permissoes.includes('loja.produtos.gerenciar') || u.permissoes.includes('loja.pedidos.gerenciar');

@Injectable()
export class LojaPedidosService {
  private readonly logger = new Logger(LojaPedidosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventos: LojaPedidosEventos,
    private readonly whatsapp: WhatsappService,
    private readonly pagamentos: PagamentosService,
    private readonly impressora: ImpressoraService,
  ) {}

  // ==================== OPERAÇÕES / EVENTOS ====================

  async listarOperacoes() {
    return jsonSeguro(await this.prisma.lojaOperacao.findMany({
      orderBy: [{ status: 'asc' }, { criadoEm: 'desc' }],
      include: { _count: { select: { pedidos: true } } },
      take: 300, // teto de segurança: histórico de operações cresce com o tempo
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
    const { pngDataUrl, svg } = await renderizarQr(url, { margin: 2, width: 512 });
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
      cartazUrl: dto.cartazUrl?.trim() || null,
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
        const disponivel = saldoDisponivel(Number(saldo?.saldoFisico ?? 0), Number(saldo?.reservado ?? 0));
        return {
          produtoId: p.id, nome: p.nome, descricao: p.descricao, preco: Number(p.preco),
          imagemUrl: p.imagemUrl ?? null, categoria: p.categoria?.nome ?? null, categoriaCor: p.categoria?.cor ?? null,
          precisaPreparacao: p.precisaPreparacao,
          emDestaque: p.emDestaque,
          disponivel: p.controlaEstoque && !p.vendeSemEstoque ? Math.max(0, disponivel) : null,
          esgotado: p.controlaEstoque && !p.vendeSemEstoque && disponivel <= 0,
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
      // 0) SERIALIZA a reserva por produto (PRD §9 — overselling é proibido).
      //    Sem isto, dois checkouts simultâneos leem o mesmo `disponivel` e ambos
      //    reservam → estoque negativo (oversell). O advisory lock por produto faz
      //    o 2º checkout esperar o 1º confirmar a reserva e então reler o saldo
      //    já atualizado — aí a validação abaixo recusa com erro amigável.
      //    Ordena os ids para evitar deadlock quando carrinhos se cruzam.
      const idsOrdenados = [...new Set(dto.itens.map((i) => i.produtoId))].sort();
      for (const pid of idsOrdenados) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`loja_estoque_${pid}`}))`;
      }

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
          const disp = saldoDisponivel(Number(saldo?.saldoFisico ?? 0), Number(saldo?.reservado ?? 0));
          if (estoqueInsuficiente(it.quantidade, disp)) {
            throw new ConflictException(`Estoque insuficiente para "${produto.nome}" (disponível: ${disp}).`);
          }
        }
        const preco = Number(produto.preco);
        const total = totalLinha(preco, it.quantidade);
        subtotal += total;
        if (produto.precisaPreparacao) precisaPreparacao = true;
        linhas.push({
          produtoId: produto.id, descricao: produto.nome, quantidade: it.quantidade,
          precoUnit: preco, total, observacao: it.observacao ?? '', controla: produto.controlaEstoque,
        });
      }
      subtotal = round2(subtotal);

      // 2) Numeração pública sequencial por operação, sem race (advisory lock).
      const numero = await this.proximoNumero(tx, operacao.id);
      // Código SECRETO de retirada (3 dígitos) que o cliente recebe já ao pedir.
      const codigoRetirada = await this.proximoCodigoRetirada(tx, operacao.id);

      // 3) Cria o pedido + itens.
      const pedido = await tx.lojaPedido.create({
        data: {
          numero, operacaoId: operacao.id, canal: dto.canal ?? 'CARDAPIO_DIGITAL',
          status: 'AGUARDANDO_PAGAMENTO', codigoRetirada,
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
        // A validação de disponibilidade acima garante que existe uma linha de
        // saldo com saldo_fisico >= quantidade (senão disponivel seria < qtd e o
        // checkout teria recusado). Por isso é UPDATE, não upsert: um upsert
        // compila para INSERT ... ON CONFLICT, e o INSERT tentativo violaria o
        // CHECK loja_estoque_reservado_ok (reservado <= saldo_fisico) antes do
        // ON CONFLICT — o saldo_fisico do payload de create seria 0.
        try {
          await tx.lojaEstoqueSaldo.update({
            where: { produtoId_local: { produtoId: l.produtoId, local: 'LOJA' } },
            data: { reservado: { increment: D(l.quantidade) } },
          });
        } catch (e) {
          // Defesa em profundidade: se ainda assim a reserva estourar o físico,
          // o CHECK loja_estoque_reservado_ok dispara — traduz para erro amigável
          // (ConflictException) em vez de 500. Detecta pelo nome da constraint na
          // mensagem (robusto a variações de código Prisma para CHECK violation).
          if (e instanceof Prisma.PrismaClientKnownRequestError && String(e.message).includes('loja_estoque_reservado_ok')) {
            throw new ConflictException(`Estoque insuficiente para "${l.descricao}".`);
          }
          throw e;
        }
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

  /**
   * Próxima SENHA da fila para a operação (PRD §4-5, §9, §16).
   * - Sequência PRÓPRIA da operação, começa em 1 (mostrada com 2 dígitos na UI).
   * - Geração ATÔMICA: advisory lock por operação + increment na mesma linha
   *   (PK) → dois pagamentos confirmados simultaneamente NUNCA recebem a mesma
   *   senha (INVARIANTE 4).
   * - NUNCA reutiliza: o contador só sobe. Uma senha cancelada não é reposta;
   *   o próximo pedido recebe o número seguinte (PRD §16).
   * Deve ser chamada apenas quando o pedido realmente entra na fila.
   */
  private async proximaSenha(tx: Prisma.TransactionClient, operacaoId: string): Promise<number> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`loja_senha_${operacaoId}`}))`;
    const linha = await tx.lojaNumeracaoPedido.upsert({
      where: { operacaoId },
      create: { operacaoId, ultimo: 1000, ultimaSenha: 1 },
      update: { ultimaSenha: { increment: 1 } },
    });
    return linha.ultimaSenha;
  }

  /**
   * CÓDIGO SECRETO de retirada de 3 dígitos (100..999, aleatório) que o cliente
   * recebe ao fazer o pedido. É PRIVADO — mostrado só ao próprio cliente no
   * comprovante, nunca no painel/TV. O vendedor DIGITA este código no balcão
   * para achar o pedido, conferir/editar o carrinho e imprimir.
   *
   * Unicidade: garantida apenas entre os pedidos ATIVOS (não retirados nem
   * cancelados) da MESMA operação — assim um código pode ser reaproveitado
   * depois que o pedido finaliza (senão esgotaria em ~900 pedidos por operação).
   * Gera sob advisory lock por operação + sorteio com retry; se por acaso todos
   * os 900 códigos estiverem ocupados ao mesmo tempo, devolve null (o fluxo não
   * quebra — o pedido só fica sem código secreto e usa a senha/QR normalmente).
   */
  private async proximoCodigoRetirada(tx: Prisma.TransactionClient, operacaoId: string): Promise<number | null> {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`loja_codigo_${operacaoId}`}))`;
    const ativos = await tx.lojaPedido.findMany({
      where: { operacaoId, codigoRetirada: { not: null }, status: { notIn: ['RETIRADO', 'CANCELADO'] } },
      select: { codigoRetirada: true },
    });
    const ocupados = new Set(ativos.map((p) => p.codigoRetirada!));
    // Seleção pura (sorteio com retry + fallback de varredura) — ver regras/calculos.
    return escolherCodigoRetirada(ocupados);
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
        parcelas: dto.parcelas, cartao: dto.cartao,
      });
      const atualizado = await this.prisma.lojaPedidoPagamento.update({
        where: { id: pagamento.id },
        data: {
          gatewayId: cobranca.gatewayId ?? undefined,
          gatewayPayload: cobranca.payload === undefined ? undefined : (jsonSeguro(cobranca.payload) as Prisma.InputJsonValue),
          pixQrcode: cobranca.pixQrcode ?? undefined,
          pixCopiaCola: cobranca.pixCopiaCola ?? undefined,
          pixExpiracao: cobranca.pixExpiracao ?? undefined,
          ...(cobranca.statusImediato && cobranca.statusImediato !== 'PENDENTE' ? { status: cobranca.statusImediato } : {}),
        },
      });

      // Cartão aprovado confirma na hora (não há webhook no caminho feliz):
      // baixa estoque, gera recebível e entra na fila — como o webhook faria.
      if (cobranca.statusImediato === 'CONFIRMADO') {
        await this.confirmarPagamento(pedidoId, { pagamentoId: pagamento.id, gatewayId: cobranca.gatewayId ?? undefined }, 'webhook');
        return jsonSeguro(await this.prisma.lojaPedidoPagamento.findUnique({ where: { id: pagamento.id } }));
      }
      // Cartão recusado: erro amigável (o pedido segue aguardando pagamento).
      if (cobranca.statusImediato === 'RECUSADO') {
        throw new BadRequestException('Pagamento com cartão recusado. Confira os dados ou tente outra forma.');
      }
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

  /**
   * FAZER PEDIDO (cardápio SEM cobrança online) — o cliente só REGISTRA o
   * pedido; o pagamento acontece no BALCÃO na hora da retirada. Diferente de
   * confirmarPagamento:
   *   - NÃO exige um pagamento PENDENTE, NÃO cria recebível no Financeiro
   *     (a receita é lançada quando o operador cobrar no balcão);
   *   - baixa a reserva de estoque → saída (o item já é do cliente) e entra na
   *     FILA com senha + token de retirada (o cliente precisa do código/QR p/
   *     retirar), mas o pedido fica marcado como "confirmado, a pagar".
   * Idempotente por pedido (reenvio devolve o estado atual).
   */
  async fazerPedidoBalcao(pedidoId: string) {
    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.lojaPedido.findUnique({ where: { id: pedidoId }, include: { itens: true, operacao: true } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (pedido.status === 'CANCELADO') throw new BadRequestException('Pedido cancelado.');
      if (pedido.status !== 'AGUARDANDO_PAGAMENTO') {
        // Já registrado — idempotente.
        return { pedido: jsonSeguro(pedido), jaFeito: true, posicao: pedido.posicaoFila, senha: pedido.senhaFila };
      }

      // Reserva → saída física (o item passa a ser do cliente ao fazer o pedido).
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
          data: { produtoId: it.produtoId, local: 'LOJA', tipo: 'saida', quantidade: it.quantidade, saldoApos: D(saldoFisico - qtd), origem: 'cardapio', referenciaId: `PED-${pedido.numero}`, observacao: `Pedido #${pedido.numero} (a pagar no balcão)` },
        });
      }

      // Todo pedido do cardápio entra na fila com senha (o cliente não está no balcão).
      let senha: number | null = pedido.senhaFila;
      if (senha == null) senha = await this.proximaSenha(tx, pedido.operacaoId!);
      const posicao = await this.calcularPosicaoFila(tx, pedido.operacaoId);

      const atualizado = await tx.lojaPedido.update({
        where: { id: pedido.id },
        data: {
          status: 'NA_FILA', confirmadoEm: new Date(),
          // Token de retirada: o cliente precisa do QR/código p/ retirar no balcão.
          tokenRetirada: pedido.tokenRetirada ?? gerarTokenRetirada(),
          entrouFilaEm: new Date(), posicaoFila: posicao, senhaFila: senha,
          historico: { create: [
            { deStatus: 'AGUARDANDO_PAGAMENTO', paraStatus: 'NA_FILA', origem: 'cliente', observacao: senha != null ? `Pedido feito — pagamento no balcão · senha ${fmtSenha(senha)}` : 'Pedido feito — pagamento no balcão' },
          ] },
        },
        include: { itens: true, operacao: true },
      });
      return { pedido: jsonSeguro(atualizado), jaFeito: false, posicao, senha };
    });

    if (!resultado.jaFeito) {
      const p = resultado.pedido as unknown as { id: string; numero: number; operacaoId: string | null; clienteTel: string | null };
      this.eventos.emitir({ tipo: 'fila', operacaoId: p.operacaoId ?? undefined });
      this.eventos.emitir({ tipo: 'pedido', pedidoId: p.id });
      void this.avisar(p.clienteTel, mensagemRegua('confirmado', resultado.senha ?? null, p.numero, resultado.posicao));
      void this.auditar({ entidade: 'pedido', entidadeId: p.id, acao: 'pedido.feito.balcao', origem: 'cliente', depois: { numero: p.numero, senha: resultado.senha ?? null } });
    }
    return resultado.pedido;
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
        // Já confirmado antes — idempotente, devolve como está (senha preservada).
        return { pedido: jsonSeguro(pedido), jaConfirmado: true, posicao: pedido.posicaoFila, senha: pedido.senhaFila };
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

      // Próximo estado (PRD §17,§37): pagamento confirmado NÃO significa PRONTO.
      // No CARDÁPIO DIGITAL o cliente não está no balcão — todo pedido pago
      // ENTRA NA FILA ("em preparação") e recebe SENHA, indo a PRONTO só quando
      // o operador marcar. A flag precisaPreparacao só dispensa a fila no balcão
      // (venda entregue na hora, §7), nunca no cardápio.
      const entraNaFila = pedido.canal === 'CARDAPIO_DIGITAL' || pedido.precisaPreparacao;
      let posicao: number | null = null;
      let senha: number | null = pedido.senhaFila; // idempotência: preserva se já tinha
      let novoStatus: string;
      if (entraNaFila) {
        // Só gera senha nova se o pedido ainda não tem uma (INVARIANTE 2/3).
        if (senha == null) senha = await this.proximaSenha(tx, pedido.operacaoId!);
        posicao = await this.calcularPosicaoFila(tx, pedido.operacaoId);
        novoStatus = 'NA_FILA';
      } else {
        novoStatus = 'PRONTO';
      }

      const atualizado = await tx.lojaPedido.update({
        where: { id: pedido.id },
        data: {
          status: novoStatus, lancamentoId: lanc.id, confirmadoEm: new Date(),
          // Comprovante com QR: o cliente pagou → gera o token de retirada.
          tokenRetirada: pedido.tokenRetirada ?? gerarTokenRetirada(),
          ...(novoStatus === 'NA_FILA'
            ? { entrouFilaEm: new Date(), posicaoFila: posicao, senhaFila: senha }
            : { prontoEm: new Date() }),
          historico: { create: [
            { deStatus: 'AGUARDANDO_PAGAMENTO', paraStatus: 'PAGAMENTO_CONFIRMADO', origem, usuarioId: u?.id, observacao: `Pagamento ${pagamento.forma} confirmado` },
            { deStatus: 'PAGAMENTO_CONFIRMADO', paraStatus: novoStatus, origem, usuarioId: u?.id, observacao: senha != null ? `Entrou na fila — senha ${fmtSenha(senha)}` : 'Pronto para retirada' },
          ] },
        },
        include: { itens: true, operacao: true },
      });
      return { pedido: jsonSeguro(atualizado), jaConfirmado: false, posicao, senha };
    });

    if (!resultado.jaConfirmado) {
      const p = resultado.pedido as unknown as { id: string; numero: number; operacaoId: string | null; clienteTel: string | null; total: string };
      this.eventos.emitir({ tipo: 'fila', operacaoId: p.operacaoId ?? undefined });
      this.eventos.emitir({ tipo: 'pedido', pedidoId: p.id });
      void this.avisar(p.clienteTel, mensagemRegua('confirmado', resultado.senha ?? null, p.numero, resultado.posicao));
      void this.auditar({ entidade: 'pedido', entidadeId: p.id, acao: 'pagamento.confirmado', origem, depois: { numero: p.numero, senha: resultado.senha ?? null, total: p.total } }, u);
    }
    return resultado.pedido;
  }

  /**
   * Posição DINÂMICA na fila (PRD §14-15): quantos pedidos ativos entraram
   * ANTES deste + 1. Calculada por ordem de ENTRADA na fila (entrou_fila_em),
   * não pelo número/senha. Recalculada quando a fila anda; a SENHA nunca muda.
   * Usada tanto ao inserir quanto na leitura da TV.
   */
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
   * ENVIAR_PREPARACAO → NA_FILA (entra na fila mesmo sem item de preparo, para
   * o balcão acompanhar/imprimir/entregar). Baixa o MESMO estoque (loja_estoque_saldos) e
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
        if (produto.controlaEstoque && !produto.vendeSemEstoque) {
          const disp = saldoDisponivel(saldoFisico, Number(saldo?.reservado ?? 0));
          if (estoqueInsuficiente(it.quantidade, disp)) throw new ConflictException(`Estoque insuficiente para "${produto.nome}" (disponível: ${disp}).`);
        }
        const preco = Number(produto.preco);
        const total = totalLinha(preco, it.quantidade);
        subtotal += total;
        if (produto.precisaPreparacao) precisaPreparacao = true;
        linhas.push({ produtoId: produto.id, descricao: produto.nome, quantidade: it.quantidade, precoUnit: preco, total, observacao: it.observacao ?? '', controla: produto.controlaEstoque && !produto.vendeSemEstoque, saldoFisico });
      }
      subtotal = round2(subtotal);
      const desconto = descontoValido(dto.desconto ?? 0, subtotal);
      const total = totalComDesconto(subtotal, desconto);

      // 2) Split: as formas precisam somar o total.
      const { pago, fecha } = conferirSplit(dto.pagamentos, total);
      if (!fecha) {
        throw new BadRequestException(`O split de pagamentos (${pago.toFixed(2)}) não fecha com o total da venda (${total.toFixed(2)}).`);
      }

      // 3) Estado final conforme o modo do operador. Quando o operador escolhe
      //    ENVIAR_PREPARACAO (é o padrão do PDV móvel), o pedido entra na FILA
      //    mesmo que nenhum item exija preparo — assim o balcão acompanha,
      //    imprime o cupom e entrega pela fila unificada.
      const enviarPreparacao = dto.modo === 'ENVIAR_PREPARACAO';
      const numero = await this.proximoNumero(tx, operacao.id);
      let posicao: number | null = null;
      let senha: number | null = null;
      let codigoRetirada: number | null = null;
      let status: string;
      if (enviarPreparacao) {
        senha = await this.proximaSenha(tx, operacao.id); // senha da fila (PRD §6)
        codigoRetirada = await this.proximoCodigoRetirada(tx, operacao.id); // código secreto p/ o balcão
        posicao = await this.calcularPosicaoFila(tx, operacao.id);
        status = 'NA_FILA';
      } else status = 'RETIRADO'; // entrega imediata: não ocupa fila, sem senha (PRD §7)

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
          precisaPreparacao, posicaoFila: posicao, senhaFila: senha, codigoRetirada, lancamentoId: lanc.id,
          // Só gera token de retirada quando o pedido vai para a fila (o cliente
          // sai e volta). Se entrega na hora (ENTREGAR_AGORA) já nasce RETIRADO.
          ...(enviarPreparacao ? { tokenRetirada: gerarTokenRetirada() } : {}),
          confirmadoEm: agora, ...(enviarPreparacao ? { entrouFilaEm: agora } : { prontoEm: agora, retiradoEm: agora }),
          observacoes: dto.observacoes ?? '',
          itens: { create: linhas.map((l) => ({ produtoId: l.produtoId, descricao: l.descricao, quantidade: D(l.quantidade), precoUnit: D(l.precoUnit), total: D(l.total), observacao: l.observacao })) },
          pagamentos: { create: dto.pagamentos.map((p) => ({ provider: 'manual', forma: p.forma, status: 'CONFIRMADO', valor: D(p.valor), confirmadoEm: agora })) },
          historico: { create: [
            { paraStatus: 'PAGAMENTO_CONFIRMADO', origem: 'operador', usuarioId: u.id, observacao: `Venda PDV (split: ${dto.pagamentos.map((p) => p.forma).join(', ')})` },
            { deStatus: 'PAGAMENTO_CONFIRMADO', paraStatus: status, origem: 'operador', usuarioId: u.id, observacao: enviarPreparacao ? (precisaPreparacao ? 'Enviado para preparação' : 'Enviado para a fila') : 'Entregue no balcão' },
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
    void this.avisar(pedido.clienteTel, mensagemRegua('proximo', pedido.senhaFila, pedido.numero));
    return jsonSeguro(pedido);
  }

  async iniciarPreparacao(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['NA_FILA', 'PROXIMO'], 'EM_PREPARACAO', u, 'preparacaoEm');
    void this.avisar(pedido.clienteTel, mensagemRegua('preparacao', pedido.senhaFila, pedido.numero));
    // Ao entrar em preparação, IMPRIME o ticket automaticamente (o preparador
    // usa para montar o pedido; vai anexado à entrega). Best-effort: uma falha
    // na impressora NÃO derruba a transição da fila. Ligado por padrão; pode ser
    // desativado com LOJA_IMPRIMIR_AO_PREPARAR=false.
    if (process.env.LOJA_IMPRIMIR_AO_PREPARAR !== 'false') {
      void this.imprimirCupom(pedidoId, u).catch((e) =>
        this.logger.warn(`Falha ao imprimir cupom automático do pedido ${pedidoId}: ${e instanceof Error ? e.message : e}`),
      );
    }
    return jsonSeguro(pedido);
  }

  async marcarPronto(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['EM_PREPARACAO', 'PROXIMO', 'NA_FILA'], 'PRONTO', u, 'prontoEm');
    void this.avisar(pedido.clienteTel, mensagemRegua('pronto', pedido.senhaFila, pedido.numero));
    return jsonSeguro(pedido);
  }

  async confirmarRetirada(pedidoId: string, u: UsuarioLogado) {
    const { pedido } = await this.transicionar(pedidoId, ['PRONTO', 'EM_PREPARACAO'], 'RETIRADO', u, 'retiradoEm');
    void this.auditar({ entidade: 'pedido', entidadeId: pedido.id, acao: 'pedido.retirado', origem: 'operador', depois: { numero: pedido.numero } }, u);
    return jsonSeguro(pedido);
  }

  /**
   * Move o pedido para um status válido (avanço OU regressão manual).
   * Transições permitidas:
   *   NA_FILA   → EM_PREPARACAO | PRONTO
   *   EM_PREPARACAO → NA_FILA | PRONTO
   *   PRONTO    → NA_FILA | EM_PREPARACAO
   * Não muda pagamento, estoque, financeiro — só a posição na fila.
   */
  async moverStatus(pedidoId: string, dto: MoverStatusDto, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode mover pedidos na fila.');
    const pedido = await this.prisma.lojaPedido.findUnique({ where: { id: pedidoId } });
    if (!pedido) throw new NotFoundException('Pedido não encontrado.');

    const permitidos: Record<string, string[]> = {
      NA_FILA: ['EM_PREPARACAO', 'PRONTO'],
      EM_PREPARACAO: ['NA_FILA', 'PRONTO'],
      PRONTO: ['NA_FILA', 'EM_PREPARACAO'],
    };
    if (!permitidos[pedido.status]?.includes(dto.paraStatus)) {
      throw new BadRequestException(`Não é possível mover de ${pedido.status} para ${dto.paraStatus}.`);
    }

    const campoData: Record<string, string | undefined> = {
      EM_PREPARACAO: 'preparacaoEm',
      PRONTO: 'prontoEm',
      NA_FILA: undefined,
    };
    const campo = campoData[dto.paraStatus];

    const atualizado = await this.prisma.lojaPedido.update({
      where: { id: pedidoId },
      data: {
        status: dto.paraStatus,
        ...(campo ? { [campo]: new Date() } : {}),
        historico: { create: { deStatus: pedido.status, paraStatus: dto.paraStatus, origem: 'operador', usuarioId: u.id, observacao: dto.observacao ?? `Movido manualmente para ${dto.paraStatus}` } },
      },
      include: { itens: true },
    });
    this.eventos.emitir({ tipo: 'fila', operacaoId: pedido.operacaoId ?? undefined });
    this.eventos.emitir({ tipo: 'pedido', pedidoId });
    void this.auditar({ entidade: 'pedido', entidadeId: pedidoId, acao: 'pedido.movido', origem: 'operador', antes: { status: pedido.status }, depois: { status: dto.paraStatus }, observacao: dto.observacao ?? undefined }, u);
    return jsonSeguro(atualizado);
  }

  /** Cancela: devolve reserva (se ainda não pago) e estorna recebível (se pago). */
  async cancelar(pedidoId: string, dto: CancelarPedidoDto, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Cancelar pedido exige permissão de operação.');
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

  // ==================== PRODUTOS DO BALCÃO ====================

  /** Lista produtos disponíveis para venda no balcão (vendePdv=true, ativo=true).
   *  Requer apenas loja.pedidos.ver — sem necessidade de pdv.ver. */
  async produtosBalcao(busca = '') {
    const rows = await this.prisma.lojaProduto.findMany({
      where: {
        ativo: true,
        vendePdv: true,
        ...(busca ? {
          OR: [
            { nome: { contains: busca, mode: 'insensitive' } },
            { sku: { contains: busca, mode: 'insensitive' } },
            { codigoBarras: { contains: busca, mode: 'insensitive' } },
          ],
        } : {}),
      },
      include: {
        saldos: { where: { local: 'LOJA' } },
        categoria: { select: { nome: true, cor: true } },
      },
      orderBy: [{ ordem: 'asc' }, { nome: 'asc' }],
      take: 100,
    });
    return rows.map((p) => {
      const saldo = p.saldos[0];
      const saldoFisico = Number(saldo?.saldoFisico ?? 0);
      const reservado = Number(saldo?.reservado ?? 0);
      return {
        produtoId: p.id,
        codigo: p.sku ?? p.codigoBarras ?? '',
        descricao: p.nome,
        preco: Number(p.preco),
        saldo: saldoFisico,
        reservado,
        disponivel: saldoFisico - reservado,
        categoria: p.categoria?.nome ?? null,
        precisaPreparacao: p.precisaPreparacao,
        controlaEstoque: p.controlaEstoque,
        vendeSemEstoque: p.vendeSemEstoque,
        imagemUrl: p.imagemUrl ?? null,
        emDestaque: p.emDestaque,
      };
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
    const p = await this.prisma.lojaPedido.findUnique({
      where: { id: pedidoId },
      select: {
        id: true, numero: true, senhaFila: true, status: true, posicaoFila: true, precisaPreparacao: true,
        operacaoId: true, entrouFilaEm: true, criadoEm: true, total: true, confirmadoEm: true,
        operacao: { select: { slug: true } },
        itens: { select: { produtoId: true, descricao: true, quantidade: true, precoUnit: true, total: true } },
      },
    });
    if (!p) throw new NotFoundException('Pedido não encontrado.');
    // Posição DINÂMICA (PRD §14,§39): enquanto o pedido está "em preparação"
    // (NA_FILA/PROXIMO/EM_PREPARACAO), conta quantos entraram na fila ANTES dele
    // na MESMA operação e ainda não saíram — mais 1. A senha nunca muda.
    let posicao: number | null = null;
    if (p.status === 'NA_FILA' || p.status === 'PROXIMO' || p.status === 'EM_PREPARACAO') {
      const ref = p.entrouFilaEm ?? p.criadoEm;
      const aFrente = await this.prisma.lojaPedido.count({
        where: {
          operacaoId: p.operacaoId,
          status: { in: ['NA_FILA', 'PROXIMO', 'EM_PREPARACAO'] },
          entrouFilaEm: { lt: ref },
        },
      });
      posicao = aFrente + 1;
    }
    return jsonSeguro({
      id: p.id, numero: p.numero, senha: p.senhaFila, status: p.status, posicao,
      total: p.total,
      pago: p.confirmadoEm != null,
      operacaoSlug: p.operacao?.slug ?? null,
      // O cliente pode editar o próprio pedido enquanto não pagou OU está na
      // fila (antes de ir para preparo).
      editavelPeloCliente: p.status === 'AGUARDANDO_PAGAMENTO' || p.status === 'NA_FILA',
      itens: p.itens.map((it) => ({
        produtoId: it.produtoId, descricao: it.descricao,
        quantidade: Number(it.quantidade), precoUnit: Number(it.precoUnit), total: Number(it.total),
      })),
    });
  }

  // ==================== COMPROVANTE + RETIRADA POR QR ====================

  /**
   * Comprovante PÚBLICO do pedido (a "receita" que o cliente carrega). Só existe
   * depois de PAGO — é a prova de compra. Traz o QR de retirada: um token opaco
   * que o vendedor escaneia no balcão para conferir e resgatar. Aqui devolvemos:
   *  - dados do pedido (número, itens, total, forma, status, operação);
   *  - `pago` e `retirado` (flags claras para a UI);
   *  - `token`, `urlRetirada` (deep-link para a tela do vendedor) e o QR já
   *    renderizado (PNG dataURL para <img> e SVG para impressão nítida).
   * Não expõe nada administrativo. Antes de pagar, devolve o comprovante SEM QR
   * (para a UI mostrar "aguardando pagamento").
   */
  async comprovante(pedidoId: string, origem?: string) {
    const p = await this.prisma.lojaPedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: true,
        operacao: { select: { nome: true, slug: true } },
        pagamentos: { where: { status: 'CONFIRMADO' }, orderBy: { confirmadoEm: 'desc' }, take: 1 },
      },
    });
    if (!p) throw new NotFoundException('Pedido não encontrado.');

    const { pago, retirado, cancelado } = avaliarRetirada(p);
    const base = { ...this.comprovanteBase(p), pago, retirado, cancelado };

    // Sem token → sem QR (ainda não pago, ou cancelado). Devolve o essencial.
    if (!p.tokenRetirada || cancelado) {
      return jsonSeguro({ ...base, token: null, urlRetirada: null, qrPngDataUrl: null, qrSvg: null });
    }

    const url = urlRetirada(this.basePublica(origem), p.tokenRetirada);
    const { pngDataUrl: qrPngDataUrl, svg: qrSvg } = await renderizarQr(url, { margin: 1, width: 420 });
    return jsonSeguro({ ...base, token: p.tokenRetirada, urlRetirada: url, qrPngDataUrl, qrSvg });
  }

  /** Recorte comum do comprovante (cliente/vendedor). Sem dados sensíveis. */
  private comprovanteBase(p: {
    id: string; numero: number; status: string; total: Prisma.Decimal; subtotal: Prisma.Decimal;
    desconto: Prisma.Decimal; clienteNome: string; criadoEm: Date; confirmadoEm: Date | null;
    prontoEm: Date | null; retiradoEm: Date | null; observacoes: string; codigoRetirada?: number | null;
    itens: { id: string; descricao: string; quantidade: Prisma.Decimal; precoUnit: Prisma.Decimal; total: Prisma.Decimal }[];
    operacao: { nome: string; slug: string | null } | null;
    pagamentos: { forma: string; confirmadoEm: Date | null }[];
  }) {
    return {
      id: p.id, numero: p.numero, status: p.status,
      operacao: p.operacao?.nome ?? 'Loja FEBRACIS',
      clienteNome: p.clienteNome || 'Consumidor',
      // Código SECRETO de retirada (3 dígitos): só neste comprovante — é privado
      // do cliente e nunca aparece no painel/TV.
      codigo: p.codigoRetirada ?? null,
      subtotal: p.subtotal, desconto: p.desconto, total: p.total,
      formaPagamento: p.pagamentos[0]?.forma ?? null,
      criadoEm: p.criadoEm, confirmadoEm: p.confirmadoEm, prontoEm: p.prontoEm, retiradoEm: p.retiradoEm,
      observacoes: p.observacoes,
      itens: p.itens.map((it) => ({
        id: it.id, descricao: it.descricao, quantidade: it.quantidade, precoUnit: it.precoUnit, total: it.total,
      })),
    };
  }

  /**
   * Consulta de retirada pelo TOKEN do QR (tela do vendedor). Só leitura — não
   * muda nada. Devolve o veredito para o balcão decidir: `podeRetirar` é true
   * só quando está pago, não cancelado e ainda não retirado. Informa também
   * quando/quem já retirou (para o caso de QR reapresentado).
   */
  async consultarRetirada(token: string) {
    const p = await this.buscarPorToken(token);
    const { pago, retirado, cancelado, podeRetirar, bloqueio } = avaliarRetirada(p);
    return jsonSeguro({
      ...this.comprovanteBase(p),
      pago, retirado, cancelado, podeRetirar, bloqueio,
      posicaoFila: p.posicaoFila,
      retiradoPorNome: p.retiradoPorNome,
      retiradoEm: p.retiradoEm,
    });
  }

  /**
   * RESGATE da retirada pelo QR (ação do vendedor). Transação com trava por
   * pedido: valida que está pago, não cancelado e não retirado; então marca
   * RETIRADO gravando QUEM resgatou. Idempotência dura: se dois vendedores
   * escanearem o mesmo QR quase juntos, só o primeiro retira — o segundo recebe
   * um 409 claro ("já retirado"). Audita o resgate.
   */
  async resgatarRetirada(token: string, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode confirmar retiradas.');

    const resultado = await this.prisma.$transaction(async (tx) => {
      const p = await tx.lojaPedido.findUnique({ where: { tokenRetirada: token }, include: { itens: true } });
      if (!p) throw new NotFoundException('Comprovante inválido — pedido não encontrado.');
      if (p.status === 'CANCELADO') throw new BadRequestException('Pedido cancelado — não pode ser retirado.');
      if (!p.confirmadoEm || p.status === 'AGUARDANDO_PAGAMENTO') {
        throw new BadRequestException('Pagamento não confirmado — não é possível retirar.');
      }
      if (p.status === 'RETIRADO') {
        // Idempotente: já retirado. Sinaliza para a UI (não é erro de infra).
        throw new ConflictException(
          `Este pedido já foi retirado${p.retiradoPorNome ? ` por ${p.retiradoPorNome}` : ''}.`,
        );
      }
      const agora = new Date();
      const atualizado = await tx.lojaPedido.update({
        where: { id: p.id },
        data: {
          status: 'RETIRADO', retiradoEm: agora, posicaoFila: null,
          retiradoPorId: u.id, retiradoPorNome: u.nome,
          historico: { create: { deStatus: p.status, paraStatus: 'RETIRADO', origem: 'operador', usuarioId: u.id, observacao: 'Retirada por QR (comprovante do cliente)' } },
        },
        include: { itens: true, operacao: { select: { nome: true, slug: true } }, pagamentos: { where: { status: 'CONFIRMADO' }, orderBy: { confirmadoEm: 'desc' }, take: 1 } },
      });
      return atualizado;
    });

    this.eventos.emitir({ tipo: 'fila', operacaoId: resultado.operacaoId ?? undefined });
    this.eventos.emitir({ tipo: 'pedido', pedidoId: resultado.id });
    void this.auditar(
      { entidade: 'pedido', entidadeId: resultado.id, acao: 'pedido.retirado', origem: 'operador', depois: { numero: resultado.numero, via: 'qrcode' } },
      u,
    );
    return jsonSeguro({ ...this.comprovanteBase(resultado), pago: true, retirado: true, cancelado: false });
  }

  /**
   * PREPARAR pelo QR (ação do vendedor no balcão): resolve o pedido pelo token
   * do comprovante e o envia para a preparação (NA_FILA/PROXIMO → EM_PREPARACAO),
   * o que já IMPRIME o cupom automaticamente (ver iniciarPreparacao). Se o pedido
   * já está em preparação/pronto, reimprime o cupom (idempotente para o operador).
   */
  async prepararPorToken(token: string, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode preparar pedidos.');
    const p = await this.buscarPorToken(token);
    if (p.status === 'CANCELADO') throw new BadRequestException('Pedido cancelado.');
    if (!p.confirmadoEm || p.status === 'AGUARDANDO_PAGAMENTO') {
      throw new BadRequestException('Pedido ainda não confirmado — não é possível preparar.');
    }
    if (p.status === 'NA_FILA' || p.status === 'PROXIMO') {
      // fluxo normal: entra em preparação (imprime o cupom automaticamente)
      return this.iniciarPreparacao(p.id, u);
    }
    // já em preparação / pronto / retirado: só reimprime o cupom (best-effort)
    void this.imprimirCupom(p.id, u).catch((e) =>
      this.logger.warn(`Falha ao reimprimir cupom do pedido ${p.id}: ${e instanceof Error ? e.message : e}`),
    );
    return jsonSeguro(p);
  }

  private async buscarPorToken(token: string) {
    const p = await this.prisma.lojaPedido.findUnique({
      where: { tokenRetirada: token },
      include: {
        itens: true,
        operacao: { select: { nome: true, slug: true } },
        pagamentos: { where: { status: 'CONFIRMADO' }, orderBy: { confirmadoEm: 'desc' }, take: 1 },
      },
    });
    if (!p) throw new NotFoundException('Comprovante inválido — nenhum pedido para este QR.');
    return p;
  }

  // ==================== BALCÃO: BUSCA POR CÓDIGO + EDIÇÃO + IMPRESSÃO ====================

  /**
   * Busca o pedido ATIVO pelo CÓDIGO SECRETO de 3 dígitos que o cliente digita
   * no balcão. Restringe aos pedidos não retirados/cancelados (o código é
   * reaproveitável depois que finaliza) — se houver operação ativa, prioriza a
   * dela. Devolve o pedido completo (itens + pagamento) para o vendedor conferir
   * e, se quiser, editar antes de entregar/imprimir.
   */
  async buscarPorCodigo(codigoBruto: string, operacaoId?: string) {
    const codigo = parseCodigoRetirada(codigoBruto);
    if (codigo == null) {
      throw new BadRequestException('Código inválido — informe os 3 dígitos do comprovante.');
    }
    const op = operacaoId
      ? { id: operacaoId }
      : (await this.prisma.lojaOperacao.findFirst({ where: { status: 'ativa' }, orderBy: { criadoEm: 'desc' } }));
    const pedidos = await this.prisma.lojaPedido.findMany({
      where: {
        codigoRetirada: codigo,
        status: { notIn: ['RETIRADO', 'CANCELADO'] },
        ...(op ? { operacaoId: op.id } : {}),
      },
      include: {
        itens: true,
        operacao: { select: { nome: true, slug: true } },
        pagamentos: { orderBy: { criadoEm: 'desc' } },
      },
      orderBy: { criadoEm: 'desc' },
      take: 2,
    });
    if (!pedidos.length) throw new NotFoundException('Nenhum pedido ativo com este código.');
    // Colisão teórica (2 ativos com o mesmo código) — devolve o mais recente e sinaliza.
    return jsonSeguro({ ...pedidos[0], ambiguo: pedidos.length > 1 });
  }

  /**
   * Edita o CARRINHO de um pedido existente (o vendedor achou pelo código e
   * ajusta itens/desconto). Substitui a lista de itens por completo, revalida
   * preço e estoque e recalcula os totais. Ajusta o estoque conforme o estágio:
   *   • AGUARDANDO_PAGAMENTO → mexe na RESERVA (ainda não baixou o físico);
   *   • já pago e na fila (NA_FILA/PROXIMO/EM_PREPARACAO) → mexe no FÍSICO
   *     (a venda já foi baixada), e reajusta o lançamento financeiro.
   * Não permite editar pedido RETIRADO/CANCELADO/PRONTO (já fechado).
   */
  /** Edição pelo VENDEDOR (achou pelo código de 3 dígitos). Pode mexer em
   *  qualquer estágio ainda aberto e alterar o desconto. */
  async editarItens(pedidoId: string, dto: EditarItensDto, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode editar pedidos.');
    return this._editarItens(pedidoId, {
      itens: dto.itens, desconto: dto.desconto, observacoes: dto.observacoes,
      statusesEditaveis: ['AGUARDANDO_PAGAMENTO', 'NA_FILA', 'PROXIMO', 'EM_PREPARACAO'],
      origem: 'operador', rotulo: 'no balcão', u,
    });
  }

  /** Edição pelo PRÓPRIO CLIENTE, pelo link do cardápio. Só enquanto ainda dá
   *  (não pagou OU está NA_FILA — antes de ir para preparo). Não mexe no
   *  desconto e nunca deixa o total AUMENTAR quando o pedido já foi pago
   *  (para incluir itens o cliente vai ao balcão). */
  async editarItensPublico(pedidoId: string, dto: EditarItensPublicoDto) {
    return this._editarItens(pedidoId, {
      itens: dto.itens, observacoes: dto.observacoes,
      statusesEditaveis: ['AGUARDANDO_PAGAMENTO', 'NA_FILA'],
      origem: 'cliente', rotulo: 'pelo cliente', bloquearAumentoSePago: true,
    });
  }

  private async _editarItens(pedidoId: string, params: {
    itens: { produtoId: string; quantidade: number; observacao?: string }[];
    desconto?: number;
    observacoes?: string;
    statusesEditaveis: string[];
    origem: string;
    rotulo: string;
    u?: UsuarioLogado;
    bloquearAumentoSePago?: boolean;
  }) {
    const { itens, statusesEditaveis, origem, rotulo, u, bloquearAumentoSePago } = params;
    if (!itens.length) throw new BadRequestException('O pedido não pode ficar sem itens.');
    const usuarioId = u?.id ?? null;
    const dto = { itens, desconto: params.desconto, observacoes: params.observacoes };

    const resultado = await this.prisma.$transaction(async (tx) => {
      const pedido = await tx.lojaPedido.findUnique({ where: { id: pedidoId }, include: { itens: true } });
      if (!pedido) throw new NotFoundException('Pedido não encontrado.');
      if (!statusesEditaveis.includes(pedido.status)) {
        throw new BadRequestException(`Este pedido não pode mais ser editado (${pedido.status}).`);
      }
      const reservado = pedido.status === 'AGUARDANDO_PAGAMENTO'; // ainda não baixou físico

      // Trava por produto (evita corrida com checkout/venda). Ordena os ids.
      const idsEnvolvidos = [...new Set([...dto.itens.map((i) => i.produtoId), ...pedido.itens.map((i) => i.produtoId)])].sort();
      for (const pid of idsEnvolvidos) {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`loja_estoque_${pid}`}))`;
      }

      // Quantidade ANTES (por produto) e valida os itens NOVOS.
      const antes = new Map<string, number>();
      for (const it of pedido.itens) antes.set(it.produtoId, (antes.get(it.produtoId) ?? 0) + Number(it.quantidade));

      let subtotal = 0;
      let precisaPreparacao = false;
      const linhas: { produtoId: string; descricao: string; quantidade: number; precoUnit: number; total: number; observacao: string; controla: boolean; saldoFisico: number; reservadoAtual: number }[] = [];
      const depois = new Map<string, number>();
      for (const it of dto.itens) {
        const produto = await tx.lojaProduto.findUnique({ where: { id: it.produtoId }, include: { saldos: { where: { local: 'LOJA' } } } });
        if (!produto || !produto.ativo) throw new BadRequestException('Produto indisponível no pedido.');
        const saldo = produto.saldos[0];
        const saldoFisico = Number(saldo?.saldoFisico ?? 0);
        const reservadoAtual = Number(saldo?.reservado ?? 0);
        const preco = Number(produto.preco);
        const total = totalLinha(preco, it.quantidade);
        subtotal += total;
        if (produto.precisaPreparacao) precisaPreparacao = true;
        depois.set(it.produtoId, (depois.get(it.produtoId) ?? 0) + it.quantidade);
        linhas.push({ produtoId: produto.id, descricao: produto.nome, quantidade: it.quantidade, precoUnit: preco, total, observacao: it.observacao ?? '', controla: produto.controlaEstoque, saldoFisico, reservadoAtual });
      }
      subtotal = round2(subtotal);
      const desconto = descontoValido(dto.desconto ?? Number(pedido.desconto), subtotal);
      const total = totalComDesconto(subtotal, desconto);

      // Cliente não pode aumentar o valor de um pedido já pago (vai ao balcão).
      if (bloquearAumentoSePago && !reservado && total > Number(pedido.total) + 0.001) {
        throw new BadRequestException(
          'Para incluir itens em um pedido já pago, procure o balcão. Aqui dá para remover itens ou trocar por algo de valor igual ou menor.',
        );
      }

      // Valida DISPONIBILIDADE para os aumentos de quantidade.
      for (const l of linhas) {
        if (!l.controla) continue;
        const delta = (depois.get(l.produtoId) ?? 0) - (antes.get(l.produtoId) ?? 0);
        if (delta <= 0) continue; // reduziu ou manteve
        // Pago: só o físico limita; ainda reservado: físico − reserva atual.
        const disp = reservado ? saldoDisponivel(l.saldoFisico, l.reservadoAtual) : l.saldoFisico;
        if (estoqueInsuficiente(delta, disp)) throw new ConflictException(`Estoque insuficiente para "${l.descricao}" (disponível: ${disp}).`);
      }

      // Aplica o DELTA de estoque produto a produto (união de antes+depois).
      for (const pid of idsEnvolvidos) {
        const delta = (depois.get(pid) ?? 0) - (antes.get(pid) ?? 0);
        if (delta === 0) continue;
        const linha = linhas.find((l) => l.produtoId === pid);
        // Se o produto saiu do carrinho não temos a flag `controla` na `linha`;
        // buscamos rápido para decidir se mexe em estoque.
        const controla = linha ? linha.controla : (await tx.lojaProduto.findUnique({ where: { id: pid }, select: { controlaEstoque: true } }))?.controlaEstoque ?? false;
        if (!controla) continue;
        if (reservado) {
          await tx.lojaEstoqueSaldo.update({ where: { produtoId_local: { produtoId: pid, local: 'LOJA' } }, data: { reservado: { increment: D(delta) } } });
          await tx.lojaEstoqueMovimento.create({ data: { produtoId: pid, local: 'LOJA', tipo: 'reserva', quantidade: D(delta), origem: 'balcao', referenciaId: `PED-${pedido.numero}`, observacao: `Ajuste de reserva (edição) pedido #${pedido.numero}`, usuarioId } });
        } else {
          // Pago: baixa/devolve o físico direto.
          await tx.lojaEstoqueSaldo.update({ where: { produtoId_local: { produtoId: pid, local: 'LOJA' } }, data: { saldoFisico: { decrement: D(delta) } } });
          await tx.lojaEstoqueMovimento.create({ data: { produtoId: pid, local: 'LOJA', tipo: delta > 0 ? 'saida' : 'entrada', quantidade: D(Math.abs(delta)), origem: 'balcao', referenciaId: `PED-${pedido.numero}`, observacao: `Ajuste de estoque (edição) pedido #${pedido.numero}`, usuarioId } });
        }
      }

      // Substitui os itens e recalcula os totais.
      await tx.lojaPedidoItem.deleteMany({ where: { pedidoId } });
      const atualizado = await tx.lojaPedido.update({
        where: { id: pedidoId },
        data: {
          subtotal: D(subtotal), desconto: D(desconto), total: D(total), precisaPreparacao,
          ...(dto.observacoes != null ? { observacoes: dto.observacoes } : {}),
          itens: { create: linhas.map((l) => ({ produtoId: l.produtoId, descricao: l.descricao, quantidade: D(l.quantidade), precoUnit: D(l.precoUnit), total: D(l.total), observacao: l.observacao })) },
          historico: { create: {
            deStatus: pedido.status, paraStatus: pedido.status, origem, usuarioId,
            observacao: `Pedido editado ${rotulo} — novo total ${total.toFixed(2)}`
              + (!reservado && total < Number(pedido.total) - 0.001
                ? ` (devolver ${(Number(pedido.total) - total).toFixed(2)} ao cliente)` : ''),
          } },
        },
        include: { itens: true, operacao: { select: { nome: true, slug: true } }, pagamentos: { orderBy: { criadoEm: 'desc' } } },
      });

      // Se já estava pago, reajusta o lançamento financeiro para o novo total.
      // Edição do cliente que REDUZ o valor: mantém `valorPago` (gera saldo a
      // devolver, visível no financeiro); o balcão faz o estorno.
      if (!reservado && pedido.lancamentoId) {
        await tx.financeiroLancamento.update({
          where: { id: pedido.lancamentoId },
          data: origem === 'cliente' ? { valor: D(total) } : { valor: D(total), valorPago: D(total) },
        }).catch(() => undefined);
      }
      return atualizado;
    });

    this.eventos.emitir({ tipo: 'pedido', pedidoId });
    this.eventos.emitir({ tipo: 'fila', operacaoId: resultado.operacaoId ?? undefined });
    void this.auditar({ entidade: 'pedido', entidadeId: pedidoId, acao: 'pedido.editado', origem, depois: { numero: resultado.numero, total: resultado.total } }, u);
    return jsonSeguro(resultado);
  }

  /**
   * Imprime o CUPOM do pedido na impressora térmica do balcão (servidor de
   * impressão exposto na IdeaPad). Mostra o código de retirada, itens, dia/hora,
   * total e desconto. Não é documento fiscal (a NFC-e tem módulo próprio).
   */
  async imprimirCupom(pedidoId: string, u: UsuarioLogado) {
    if (!opera(u)) throw new ForbiddenException('Seu perfil não pode imprimir cupons.');
    const p = await this.prisma.lojaPedido.findUnique({
      where: { id: pedidoId },
      include: {
        itens: true,
        operacao: { select: { nome: true } },
        pagamentos: { where: { status: 'CONFIRMADO' }, orderBy: { confirmadoEm: 'desc' } },
      },
    });
    if (!p) throw new NotFoundException('Pedido não encontrado.');

    const buffer = montarCupom({
      operacao: p.operacao?.nome ?? 'Loja FEBRACIS',
      numero: p.numero,
      senhaFila: p.senhaFila,
      clienteNome: p.clienteNome || undefined,
      itens: p.itens.map((it) => ({
        descricao: it.descricao,
        quantidade: Number(it.quantidade),
        precoUnit: Number(it.precoUnit),
        total: Number(it.total),
        observacao: it.observacao || undefined,
      })),
      subtotal: Number(p.subtotal),
      desconto: Number(p.desconto),
      total: Number(p.total),
      formaPagamento: p.pagamentos.map((pg) => pg.forma).join(' + ') || null,
      data: p.confirmadoEm ?? p.criadoEm,
      endereco: process.env.LOJA_ENDERECO || undefined,
      telefone: process.env.LOJA_TELEFONE || undefined,
    });

    const r = await this.impressora.imprimirEscPos(buffer);
    void this.auditar({ entidade: 'pedido', entidadeId: pedidoId, acao: 'pedido.impresso', origem: 'operador', depois: { numero: p.numero, bytes: r.bytes } }, u);
    return { ok: true, bytes: r.bytes };
  }

  /** Estado da impressora do balcão (para a UI). */
  async impressoraStatus() {
    try {
      return await this.impressora.health();
    } catch {
      return { ok: false };
    }
  }

  /**
   * Painel público / TV (PRD §18-27,§45). SEM dados pessoais — só operacional.
   * Duas listas prontas para as colunas da TV:
   *   • preparando: NA_FILA + PROXIMO + EM_PREPARACAO agrupados, com SENHA e
   *     POSIÇÃO dinâmica (ordem de entrada na fila; mais antigo primeiro, §33).
   *   • prontos: status PRONTO, ordenados por prontoEm (mais antigo primeiro, §34).
   * Também devolve o nome e o cartaz da operação p/ a 1ª coluna (§20,§22).
   * `numero` (pedido) vai junto só como referência não sensível.
   */
  async painelTv(operacaoId?: string) {
    const op = operacaoId ? { operacaoId } : {};
    const [pedidos, operacao] = await Promise.all([
      this.prisma.lojaPedido.findMany({
        where: { ...op, status: { in: ['NA_FILA', 'PROXIMO', 'EM_PREPARACAO', 'PRONTO'] } },
        select: { numero: true, senhaFila: true, status: true, prontoEm: true, entrouFilaEm: true, criadoEm: true },
      }),
      operacaoId ? this.prisma.lojaOperacao.findUnique({ where: { id: operacaoId }, select: { nome: true, cartazUrl: true } }) : null,
    ]);

    // EM PREPARAÇÃO: agrupa os 3 estados, ordena por entrada na fila (ou criação
    // como desempate), e calcula a posição dinâmica (1, 2, 3, … §14).
    const preparandoOrd = pedidos
      .filter((p) => p.status === 'NA_FILA' || p.status === 'PROXIMO' || p.status === 'EM_PREPARACAO')
      .sort((a, b) => (a.entrouFilaEm?.getTime() ?? a.criadoEm.getTime()) - (b.entrouFilaEm?.getTime() ?? b.criadoEm.getTime()));
    const preparando = preparandoOrd.map((p, i) => ({
      senha: p.senhaFila,
      numero: p.numero,
      posicao: i + 1,
      estado: p.status as 'NA_FILA' | 'PROXIMO' | 'EM_PREPARACAO',
    }));

    // PRONTO PARA RETIRADA: só a senha importa; mais antigo pronto primeiro (§26,§34).
    const prontosOrd = pedidos
      .filter((p) => p.status === 'PRONTO')
      .sort((a, b) => (a.prontoEm?.getTime() ?? 0) - (b.prontoEm?.getTime() ?? 0));
    const prontos = prontosOrd.map((p) => ({ senha: p.senhaFila, numero: p.numero }));

    return {
      operacao: operacao ? { nome: operacao.nome, cartazUrl: operacao.cartazUrl } : null,
      preparando,
      prontos,
      // Compat retro (formato antigo baseado em `numero`) — mantém a TV antiga
      // e outros consumidores funcionando até migrarem para senha.
      naFila: preparandoOrd.filter((p) => p.status === 'NA_FILA').map((p) => p.numero),
      proximo: preparandoOrd.filter((p) => p.status === 'PROXIMO').map((p) => p.numero),
      emPreparacao: preparandoOrd.filter((p) => p.status === 'EM_PREPARACAO').map((p) => p.numero),
      prontosNumeros: prontosOrd.map((p) => p.numero),
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

    return {
      maisVendidos: maisVendidos.map((m) => ({ descricao: m.descricao, quantidade: Number(m._sum.quantidade ?? 0), total: Number(m._sum.total ?? 0) })),
      formas: porForma.map((f) => ({ forma: f.forma, valor: Number(f._sum.valor ?? 0), transacoes: f._count })).sort((a, b) => b.valor - a.valor),
      canais: porCanal.map((c) => ({ canal: c.canal, valor: Number(c._sum.total ?? 0), pedidos: c._count })),
      tempoMedioPreparacaoMin: mediaMinutos(prontos.map((p) => [p.preparacaoEm ?? p.confirmadoEm, p.prontoEm])),
      tempoMedioEsperaMin: mediaMinutos(prontos.map((p) => [p.confirmadoEm, p.retiradoEm])),
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
      await this.avisar(p.clienteTel, mensagemLembretePronto(p.numero));
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
