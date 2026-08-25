/**
 * Controller do módulo Comercial — CRM de vendas.
 *
 * Permissões por grupo de rotas:
 *  comercial.ver            — GETs de consulta (dashboard, pipeline, kanban, detalhe)
 *  comercial.operar         — criação de lead, oportunidade, interação, ação, negociação, venda
 *  comercial.gerenciar      — configuração (funis, produtos, motivos)
 *  comercial.vendas.aprovar — aprovar / cancelar venda
 *
 * SetorGuard garante que só quem tem o setor 'comercial' (ou permissão
 * `setor.comercial.ver` no perfil, ou papel admin) acessa as rotas.
 */
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ComercialService } from './comercial.service';
import {
  AprovarVendaDto,
  AtualizarNegociacaoDto,
  AtualizarOportunidadeDto,
  BuscarPessoaDto,
  CancelarVendaDto,
  ConcluirAcaoDto,
  CriarLeadDto,
  CriarNegociacaoDto,
  CriarOportunidadeDto,
  CriarProximaAcaoDto,
  CriarVendaDto,
  DefinirTurmaDto,
  FiltroDashboardDto,
  FiltroKanbanDto,
  FiltroOportunidadesDto,
  FiltroVendasDto,
  MoverEtapaDto,
  RegistrarInteracaoDto,
  SyncSalesforceDto,
  TransferirResponsavelDto,
} from './comercial.dto';

@ApiTags('comercial')
@Controller('comercial')
@ExigeSetor('comercial')
@ExigePermissao('comercial.ver', 'comercial.operar', 'comercial.gerenciar', 'comercial.vendas.aprovar', 'comercial.relatorios')
export class ComercialController {
  constructor(private readonly comercial: ComercialService) {}

  /* ─────────────────────── Configuração ─────────────────────── */

  @Get('funis')
  @ExigePermissao('comercial.ver', 'comercial.operar', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Lista funis ativos com etapas ordenadas' })
  funis() {
    return this.comercial.funis();
  }

  @Get('produtos')
  @ExigePermissao('comercial.ver', 'comercial.operar', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Catálogo de produtos comerciais' })
  produtos(@Query('ativo') ativo?: string) {
    const filtroAtivo = ativo === 'true' ? true : ativo === 'false' ? false : undefined;
    return this.comercial.produtos(filtroAtivo);
  }

  @Get('motivos-perda')
  @ExigePermissao('comercial.ver', 'comercial.operar', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Motivos de perda de oportunidade' })
  motivos() {
    return this.comercial.motivos();
  }

  /* ─────────────────────── Dashboard / Operação ─────────────────────── */

  @Get('dashboard')
  @ExigePermissao('comercial.ver', 'comercial.relatorios', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Dashboard comercial: leads, pipeline, vendas, conversão, metas' })
  dashboard(@Query() filtros: FiltroDashboardDto) {
    return this.comercial.dashboard(filtros);
  }

  @Get('minha-operacao')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Resumo do dia do vendedor logado: leads novos, atrasadas, negociações' })
  minhaOperacao(@Usuario() u: UsuarioLogado) {
    return this.comercial.minhaOperacao(u.id);
  }

  /* ─────────────────────── Lead (deduplicação) ─────────────────────── */

  @Post('leads')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Cria lead com deduplicação (PRD §4) + cria oportunidade automaticamente se fornecido funilId' })
  async receberLead(
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Body() dto: CriarLeadDto,
  ) {
    return this.comercial.buscarOuCriarPessoa(dto, u.id);
  }

  @Get('leads/verificar')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Verifica se já existe pessoa com esses dados (sem criar)' })
  verificarDuplicata(@Query() dto: BuscarPessoaDto) {
    return this.comercial.verificarDuplicata(dto);
  }

  /* ─────────────────────── Oportunidades ─────────────────────── */

  @Get('oportunidades')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Pipeline paginado com filtros' })
  pipeline(@Query() filtros: FiltroOportunidadesDto, @Usuario() u: UsuarioLogado) {
    return this.comercial.pipeline(filtros, u.id);
  }

  @Get('oportunidades/kanban')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Visão kanban agrupada por etapa' })
  kanban(
    @Query('funilId', ParseUUIDPipe) funilId: string,
    @Query() filtros: FiltroKanbanDto,
  ) {
    return this.comercial.kanban(funilId, filtros);
  }

  @Post('oportunidades')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Cria nova oportunidade no pipeline' })
  criarOportunidade(
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
    @Body() dto: CriarOportunidadeDto,
  ) {
    return this.comercial.criarOportunidade(dto, u, req.ip);
  }

  @Get('oportunidades/:id')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Detalhe 360° da oportunidade: pessoa, histórico, ações, negociação' })
  obterOportunidade(@Param('id', ParseUUIDPipe) id: string, @Usuario() u: UsuarioLogado) {
    return this.comercial.obterOportunidade(id, u.id);
  }

  @Patch('oportunidades/:id')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Atualiza campos da oportunidade' })
  atualizarOportunidade(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarOportunidadeDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.atualizarOportunidade(id, dto, u, req.ip);
  }

  @Patch('oportunidades/:id/etapa')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Move oportunidade de etapa (perda exige motivo)' })
  moverEtapa(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: MoverEtapaDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.moverEtapa(id, dto, u, req.ip);
  }

  @Patch('oportunidades/:id/responsavel')
  @ExigePermissao('comercial.operar', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Transfere responsável da oportunidade' })
  transferirResponsavel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TransferirResponsavelDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.transferirResponsavel(id, dto, u, req.ip);
  }

  /* ─────────────────────── Interações ─────────────────────── */

  @Post('oportunidades/:id/interacoes')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Registra interação na oportunidade (ligação, WhatsApp, email, etc.)' })
  registrarInteracao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RegistrarInteracaoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.comercial.registrarInteracao(id, dto, u);
  }

  /* ─────────────────────── Próximas Ações ─────────────────────── */

  @Post('oportunidades/:id/acoes')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Cria próxima ação para a oportunidade' })
  criarProximaAcao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarProximaAcaoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.comercial.criarProximaAcao(id, dto, u);
  }

  @Patch('oportunidades/:id/acoes/:acaoId')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Conclui próxima ação' })
  concluirProximaAcao(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('acaoId', ParseUUIDPipe) acaoId: string,
    @Body() dto: ConcluirAcaoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.comercial.concluirProximaAcao(id, acaoId, dto.resultado, u);
  }

  /* ─────────────────────── Negociação ─────────────────────── */

  @Get('oportunidades/:id/negociacao')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Retorna a negociação da oportunidade' })
  obterNegociacao(@Param('id', ParseUUIDPipe) id: string) {
    return this.comercial.obterNegociacao(id);
  }

  @Post('oportunidades/:id/negociacao')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Cria negociação para a oportunidade (1:1)' })
  criarNegociacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarNegociacaoDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.criarNegociacao(id, dto, u, req.ip);
  }

  @Patch('oportunidades/:id/negociacao')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Atualiza negociação (apenas se não aprovada)' })
  atualizarNegociacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AtualizarNegociacaoDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.atualizarNegociacao(id, dto, u, req.ip);
  }

  /* ─────────────────────── Venda ─────────────────────── */

  @Post('oportunidades/:id/venda')
  @ExigePermissao('comercial.operar')
  @ApiOperation({ summary: 'Fecha venda a partir da negociação da oportunidade' })
  fecharVenda(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CriarVendaDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.fecharVenda(id, dto, u, req.ip);
  }

  /* ─────────────────────── Vendas ─────────────────────── */

  @Get('vendas')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Lista paginada de vendas com filtros' })
  listarVendas(@Query() filtros: FiltroVendasDto, @Usuario() u: UsuarioLogado) {
    return this.comercial.listarVendas(filtros, u.id);
  }

  @Get('vendas/:id')
  @ExigePermissao('comercial.ver', 'comercial.operar')
  @ApiOperation({ summary: 'Detalhe da venda com histórico completo' })
  obterVenda(@Param('id', ParseUUIDPipe) id: string) {
    return this.comercial.obterVenda(id);
  }

  @Post('vendas/:id/aprovar')
  @ExigePermissao('comercial.vendas.aprovar')
  @ApiOperation({ summary: 'Aprova venda e dispara evento corporativo VENDA_APROVADA' })
  aprovarVenda(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AprovarVendaDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.aprovarVenda(id, dto.observacao, u, req.ip);
  }

  @Post('vendas/:id/cancelar')
  @ExigePermissao('comercial.vendas.aprovar')
  @ApiOperation({ summary: 'Cancela venda e dispara evento corporativo VENDA_CANCELADA' })
  cancelarVenda(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CancelarVendaDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.cancelarVenda(id, dto.motivo, u, req.ip);
  }

  @Patch('vendas/:id/turma')
  @ExigePermissao('comercial.operar', 'comercial.gerenciar')
  @ApiOperation({ summary: 'Define turma da venda e dispara evento TURMA_DEFINIDA' })
  definirTurma(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: DefinirTurmaDto,
    @Usuario() u: UsuarioLogado,
    @Req() req: FastifyRequest,
  ) {
    return this.comercial.definirTurma(id, dto.turmaId, u, req.ip);
  }

  /* ─────────────────────── Salesforce (stub) ─────────────────────── */

  @Post('salesforce/sync')
  @HttpCode(200)
  @ExigePermissao('comercial.gerenciar')
  @ApiOperation({ summary: 'Registra mapeamento de IDs Salesforce ↔ ERP (idempotente)' })
  syncSalesforce(@Body() dto: SyncSalesforceDto) {
    return this.comercial.sincronizarSalesforce(dto.entidade, (dto.dados ?? {}) as Record<string, unknown>);
  }
}
