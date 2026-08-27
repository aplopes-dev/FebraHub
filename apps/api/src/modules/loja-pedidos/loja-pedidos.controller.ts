import { Body, Controller, ForbiddenException, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Put, Query, Sse } from '@nestjs/common';
import { Publica, Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import {
  CancelarPedidoDto, CheckoutDto, ConfirmarPagamentoDto, EditarItensDto, EditarItensPublicoDto, IniciarPagamentoDto, MoverStatusDto, SalvarOperacaoDto, VendaPdvDto,
} from './loja-pedidos.dto';
import { LojaPedidosEventos } from './loja-pedidos.eventos';
import { LojaPedidosService } from './loja-pedidos.service';

/**
 * Loja — Pedidos, Fila e Cardápio.
 *
 * Duas superfícies:
 *  - ADMIN/OPERAÇÃO (exige `loja.pedidos.ver`): fila operacional, transições,
 *    indicadores, gestão de operações.
 *  - PÚBLICO (`@Publica()`): cardápio por slug, checkout, iniciar pagamento,
 *    acompanhamento do cliente, painel/TV e o stream SSE. Nada sensível sai
 *    por aqui — o backend valida preço/estoque/total.
 */
@Controller('loja-pedidos')
@ExigePermissao('loja.pedidos.ver')
export class LojaPedidosController {
  constructor(
    private readonly s: LojaPedidosService,
    private readonly eventos: LojaPedidosEventos,
  ) {}

  // -------------------- PÚBLICO (cardápio / checkout / cliente) --------------------

  @Publica() @Get('publico/cardapio/:slug')
  cardapio(@Param('slug') slug: string) { return this.s.cardapioPublico(slug); }

  @Publica() @Post('publico/checkout')
  checkout(@Body() dto: CheckoutDto) { return this.s.checkout(dto); }

  @Publica() @Post('publico/pedidos/:id/pagamento')
  iniciarPagamento(@Param('id', ParseUUIDPipe) id: string, @Body() dto: IniciarPagamentoDto) {
    return this.s.iniciarPagamento(id, dto);
  }

  /** Confirmação pública (dev/homolog SEM gateway). Com ASAAS ativo, o service
   *  bloqueia — a confirmação real vem pelo webhook assinado abaixo. */
  @Publica() @Post('publico/pedidos/:id/pagamento/confirmar')
  confirmarPagamentoPublico(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmarPagamentoDto) {
    return this.s.confirmarPagamentoPublico(id, dto);
  }

  /** WEBHOOK do gateway ASAAS. Autenticado pelo header `asaas-access-token`
   *  (configurado no painel do ASAAS = env ASAAS_WEBHOOK_TOKEN). Idempotente. */
  @Publica() @Post('publico/webhook/asaas')
  webhookAsaas(@Headers('asaas-access-token') token: string | undefined, @Body() payload: unknown) {
    const esperado = process.env.ASAAS_WEBHOOK_TOKEN;
    if (esperado && token !== esperado) throw new ForbiddenException('Webhook não autorizado.');
    return this.s.processarWebhook('asaas', payload);
  }

  /** WEBHOOK do gateway Stone / Pagar.me. Autenticado pelo header
   *  `x-pagarme-signature` (ou token customizado em STONE_WEBHOOK_SECRET).
   *  A rota aceita chamadas sem assinatura quando STONE_WEBHOOK_SECRET não
   *  está configurado (não bloqueia). Idempotente. */
  @Publica() @Post('publico/webhook/stone')
  webhookStone(@Headers('x-pagarme-signature') sig: string | undefined, @Body() payload: unknown) {
    const esperado = process.env.STONE_WEBHOOK_SECRET;
    if (esperado && sig !== esperado) throw new ForbiddenException('Webhook Stone não autorizado.');
    return this.s.processarWebhook('stone', payload);
  }

  @Publica() @Get('publico/pedidos/:id/acompanhar')
  acompanhar(@Param('id', ParseUUIDPipe) id: string) { return this.s.acompanhar(id); }

  /** O PRÓPRIO CLIENTE edita o pedido pelo link do cardápio — só enquanto não
   *  pagou ou está NA_FILA (antes do preparo). Não mexe no desconto e não deixa
   *  o total de um pedido pago aumentar. */
  @Publica() @Patch('publico/pedidos/:id/itens')
  editarItensPublico(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EditarItensPublicoDto) {
    return this.s.editarItensPublico(id, dto);
  }

  /** Comprovante do cliente (a "receita" com o QR de retirada). Público por
   *  desenho — o cliente abre no próprio aparelho depois de pagar. Só expõe
   *  dados do pedido + o QR; o token embutido só serve para o vendedor
   *  autenticado resgatar no balcão. */
  @Publica() @Get('publico/pedidos/:id/comprovante')
  comprovante(@Param('id', ParseUUIDPipe) id: string, @Headers('origin') origem?: string) {
    return this.s.comprovante(id, origem);
  }

  @Publica() @Get('publico/painel')
  painel(@Query('operacaoId') operacaoId?: string) { return this.s.painelTv(operacaoId); }

  /** Stream de tempo real (fila/TV/acompanhamento). Público por desenho. */
  @Publica() @Sse('publico/eventos')
  streamEventos() { return this.eventos.stream(); }

  // -------------------- CONSULTAS (autenticadas) --------------------

  /** Produtos do balcão — exige apenas loja.pedidos.ver (não pdv.ver). */
  @Get('balcao/produtos')
  produtosBalcao(@Query('busca') busca?: string) { return this.s.produtosBalcao(busca); }

  @Get('indicadores') indicadores(@Query('operacaoId') operacaoId?: string) { return this.s.indicadores(operacaoId); }
  @Get('dashboard') dashboard(@Query('operacaoId') operacaoId?: string) { return this.s.dashboard(operacaoId); }
  @Get('operacoes') operacoes() { return this.s.listarOperacoes(); }
  @Get('operacoes/ativa') operacaoAtiva() { return this.s.operacaoAtiva(); }

  /** QR Code do cardápio da operação (PRD §11). Devolve URL + PNG (dataURL) +
   *  SVG. Usa o header Origin como fallback quando FRONTEND_URL/APP_URL não
   *  estiverem setados (ambiente local). */
  @Get('operacoes/:slug/qrcode')
  qrcodeCardapio(@Param('slug') slug: string, @Headers('origin') origem?: string) {
    return this.s.qrCodeCardapio(slug, origem);
  }
  @Get('pedidos') pedidos(@Query('operacaoId') operacaoId?: string, @Query('status') status?: string) { return this.s.listar(operacaoId, status); }
  @Get('pedidos/:id') pedido(@Param('id', ParseUUIDPipe) id: string) { return this.s.obter(id); }

  /** Trilha de auditoria (PRD §48) — exige gestão. */
  @Get('auditoria') @ExigePermissao('loja.pedidos.gerenciar')
  auditoria(@Query('entidade') entidade?: string, @Query('entidadeId') entidadeId?: string, @Query('acao') acao?: string, @Query('de') de?: string, @Query('ate') ate?: string) {
    return this.s.listarAuditoria({ entidade, entidadeId, acao, de, ate });
  }

  // -------------------- OPERAÇÃO DA FILA (exige loja.pedidos.operar) --------------------

  /** Venda no balcão pela fila unificada (canal PDV) com split de pagamento. */
  @Post('pdv/venda') @ExigePermissao('loja.pedidos.operar')
  vendaPdv(@Body() dto: VendaPdvDto, @Usuario() u: UsuarioLogado) { return this.s.vendaPdv(dto, u); }

  @Post('pedidos/:id/pagamento/confirmar') @ExigePermissao('loja.pedidos.operar')
  confirmarPagamento(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ConfirmarPagamentoDto, @Usuario() u: UsuarioLogado) {
    return this.s.confirmarPagamento(id, dto, 'operador', u);
  }
  @Post('pedidos/:id/proximo') @ExigePermissao('loja.pedidos.operar')
  proximo(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.marcarProximo(id, u); }
  @Post('pedidos/:id/preparar') @ExigePermissao('loja.pedidos.operar')
  preparar(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.iniciarPreparacao(id, u); }
  @Post('pedidos/:id/pronto') @ExigePermissao('loja.pedidos.operar')
  pronto(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.marcarPronto(id, u); }
  @Post('pedidos/:id/retirar') @ExigePermissao('loja.pedidos.operar')
  retirar(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) { return this.s.confirmarRetirada(id, u); }

  /** Move o pedido para qualquer status de fila (avanço ou regressão manual). */
  @Post('pedidos/:id/mover') @ExigePermissao('loja.pedidos.operar')
  mover(@Param('id', ParseUUIDPipe) id: string, @Body() dto: MoverStatusDto, @Usuario() u: UsuarioLogado) { return this.s.moverStatus(id, dto, u); }

  // -------------------- RETIRADA POR QR (vendedor escaneia o comprovante) --------------------

  /** Consulta o pedido pelo TOKEN do QR do comprovante. Só leitura — devolve o
   *  veredito (`podeRetirar`) e o motivo do bloqueio quando não. Exige operar. */
  @Get('retirada/:token') @ExigePermissao('loja.pedidos.operar')
  consultarRetirada(@Param('token') token: string) { return this.s.consultarRetirada(token); }

  /** Resgata a retirada pelo TOKEN do QR: valida pago/não-retirado e marca
   *  RETIRADO gravando quem resgatou. Idempotente (409 em QR reapresentado). */
  @Post('retirada/:token/confirmar') @ExigePermissao('loja.pedidos.operar')
  resgatarRetirada(@Param('token') token: string, @Usuario() u: UsuarioLogado) { return this.s.resgatarRetirada(token, u); }

  // -------------------- BALCÃO: CÓDIGO DE 3 DÍGITOS + EDIÇÃO + IMPRESSÃO --------------------

  /** Estado da impressora térmica do balcão (para a UI habilitar o botão). */
  @Get('impressora/status') @ExigePermissao('loja.pedidos.operar')
  impressoraStatus() { return this.s.impressoraStatus(); }

  /** Busca o pedido ATIVO pelo CÓDIGO SECRETO de 3 dígitos que o cliente digita
   *  no balcão. Devolve o pedido completo para o vendedor conferir/editar. */
  @Get('codigo/:codigo') @ExigePermissao('loja.pedidos.operar')
  buscarPorCodigo(@Param('codigo') codigo: string, @Query('operacaoId') operacaoId?: string) {
    return this.s.buscarPorCodigo(codigo, operacaoId);
  }

  /** Edita o carrinho do pedido (itens + desconto) — o vendedor ajusta antes de
   *  entregar/imprimir. Revalida preço/estoque e recalcula os totais. */
  @Patch('pedidos/:id/itens') @ExigePermissao('loja.pedidos.operar')
  editarItens(@Param('id', ParseUUIDPipe) id: string, @Body() dto: EditarItensDto, @Usuario() u: UsuarioLogado) {
    return this.s.editarItens(id, dto, u);
  }

  /** Imprime o cupom do pedido na impressora térmica do balcão. */
  @Post('pedidos/:id/imprimir') @ExigePermissao('loja.pedidos.operar')
  imprimirCupom(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) {
    return this.s.imprimirCupom(id, u);
  }

  // -------------------- GESTÃO (exige loja.pedidos.gerenciar) --------------------

  @Post('pedidos/:id/cancelar') @ExigePermissao('loja.pedidos.operar')
  cancelar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CancelarPedidoDto, @Usuario() u: UsuarioLogado) {
    return this.s.cancelar(id, dto, u);
  }
  @Post('operacoes') @ExigePermissao('loja.pedidos.gerenciar')
  criarOperacao(@Body() dto: SalvarOperacaoDto, @Usuario() u: UsuarioLogado) { return this.s.salvarOperacao(dto, u); }
  @Put('operacoes/:id') @ExigePermissao('loja.pedidos.gerenciar')
  editarOperacao(@Param('id', ParseUUIDPipe) id: string, @Body() dto: SalvarOperacaoDto, @Usuario() u: UsuarioLogado) {
    return this.s.salvarOperacao(dto, u, id);
  }
}
