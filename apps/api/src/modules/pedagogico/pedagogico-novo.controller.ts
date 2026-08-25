import {
  Body, Controller, Delete, Get, Param, Patch, Post, Put, Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigeSetor } from '../../common/guards/setor.guard';

import { TurmasService }         from './turmas/turmas.service';
import { MatriculasService }     from './matriculas/matriculas.service';
import { CredenciamentoService } from './credenciamento/credenciamento.service';
import { DashboardService }      from './dashboard/dashboard.service';
import { ConfirmacoesService }   from './confirmacoes/confirmacoes.service';
import { TransferenciasService } from './transferencias/transferencias.service';
import { MonitoresService }      from './monitores/monitores.service';
import { SolicitacoesService }   from './solicitacoes/solicitacoes.service';
import { CsService }             from './cs/cs.service';

import { CriarTurmaDto, AtualizarTurmaDto, FiltrosTurmaQuery } from './dto/turma.dto';
import {
  CriarMatriculaDto, AtualizarStatusMatriculaDto, FiltrosMatriculaQuery, IntegrarVendaDto,
} from './dto/matricula.dto';
import {
  BuscarParaCredenciamentoQuery, CheckinQrDto, CredenciarAlunoDto, EfetivarTransferenciaDto,
  EscalarMonitorDto, CriarMonitorDto, RegistrarConfirmacaoDto, RegistrarPresencaDto,
  SolicitarTransferenciaDto, CriarSolicitacaoDto, DashboardQuery,
} from './dto/operacional.dto';

@ApiTags('pedagogico-v2')
@Controller('pedagogico/v2')
@ExigeSetor('pedagogico')
export class PedagogicoNovoController {
  constructor(
    private readonly turmas:         TurmasService,
    private readonly matriculas:     MatriculasService,
    private readonly credenciamento: CredenciamentoService,
    private readonly dashboard:      DashboardService,
    private readonly confirmacoes:   ConfirmacoesService,
    private readonly transferencias: TransferenciasService,
    private readonly monitores:      MonitoresService,
    private readonly solicitacoes:   SolicitacoesService,
    private readonly cs:             CsService,
  ) {}

  // ================================================================
  // DASHBOARD
  // ================================================================

  @Get('dashboard')
  @ApiOperation({ summary: 'Dashboard pedagógico operacional + executivo' })
  dashboard_(@Query() q: DashboardQuery) {
    return this.dashboard.resumo(q);
  }

  @Get('represados')
  @ApiOperation({ summary: 'Lista de alunos represados com alerta de validade' })
  represados(@Query() q: DashboardQuery) {
    return this.dashboard.represados(q);
  }

  // ================================================================
  // TURMAS
  // ================================================================

  @Get('turmas')
  @ApiOperation({ summary: 'Lista turmas com filtros e contadores' })
  listarTurmas(@Query() q: FiltrosTurmaQuery) {
    return this.turmas.listar(q);
  }

  @Get('turmas/:id')
  @ApiOperation({ summary: 'Detalhe da turma com alunos, escalas e indicadores' })
  buscarTurma(@Param('id') id: string) {
    return this.turmas.buscarPorId(id);
  }

  @Post('turmas')
  @ApiOperation({ summary: 'Cria nova turma operacional' })
  criarTurma(@Body() dto: CriarTurmaDto, @Usuario() u: UsuarioLogado) {
    return this.turmas.criar(dto, u);
  }

  @Put('turmas/:id')
  @ApiOperation({ summary: 'Atualiza dados da turma' })
  atualizarTurma(@Param('id') id: string, @Body() dto: AtualizarTurmaDto, @Usuario() u: UsuarioLogado) {
    return this.turmas.atualizar(id, dto, u);
  }

  @Patch('turmas/:id/status')
  @ApiOperation({ summary: 'Muda o status da turma (ex: Confirmada → Em Andamento)' })
  mudarStatusTurma(
    @Param('id') id: string,
    @Body('status') status: string,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.turmas.mudarStatus(id, status, u);
  }

  @Delete('turmas/:id')
  @ApiOperation({ summary: 'Cancela (arquiva) a turma — soft-delete via status Cancelada' })
  removerTurma(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.turmas.remover(id, u);
  }

  // ================================================================
  // MATRÍCULAS
  // ================================================================

  @Get('matriculas')
  @ApiOperation({ summary: 'Lista matrículas com filtros (status, turma, busca)' })
  listarMatriculas(@Query() q: FiltrosMatriculaQuery) {
    return this.matriculas.listar(q);
  }

  @Get('matriculas/:id')
  @ApiOperation({ summary: 'Detalhe completo da matrícula com jornada' })
  buscarMatricula(@Param('id') id: string) {
    return this.matriculas.buscarPorId(id);
  }

  @Post('matriculas')
  @ApiOperation({ summary: 'Cria nova matrícula manualmente' })
  criarMatricula(@Body() dto: CriarMatriculaDto, @Usuario() u: UsuarioLogado) {
    return this.matriculas.criar(dto, u);
  }

  @Patch('matriculas/:id/status')
  @ApiOperation({ summary: 'Atualiza status da jornada do aluno' })
  atualizarStatus(
    @Param('id') id: string,
    @Body() dto: AtualizarStatusMatriculaDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.matriculas.atualizarStatus(id, dto, u);
  }

  @Delete('matriculas/:id')
  @ApiOperation({ summary: 'Cancela a matrícula — soft-delete via status Cancelado (preserva histórico)' })
  removerMatricula(
    @Param('id') id: string,
    @Body('motivo') motivo: string | undefined,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.matriculas.remover(id, motivo, u);
  }

  @Get('alunos/:pessoaId/jornada')
  @ApiOperation({ summary: 'Secretaria do Aluno: jornada completa de uma pessoa' })
  jornada(@Param('pessoaId') pessoaId: string) {
    return this.matriculas.buscarJornada(pessoaId);
  }

  // ================================================================
  // INTEGRAÇÃO SALESFORCE
  // ================================================================

  @Post('integracoes/venda-aprovada')
  @ApiOperation({ summary: 'Webhook/integração: VENDA_APROVADA do Salesforce (idempotente)' })
  integrarVenda(@Body() dto: IntegrarVendaDto, @Usuario() u: UsuarioLogado) {
    return this.matriculas.integrarVenda(dto, u);
  }

  // ================================================================
  // CREDENCIAMENTO
  // ================================================================

  @Get('credenciamento/buscar')
  @ApiOperation({ summary: 'Busca aluno para credenciamento (CPF, nome, QR, UUID)' })
  buscarParaCredenciar(@Query() q: BuscarParaCredenciamentoQuery) {
    return this.credenciamento.buscarParaCredenciar(q);
  }

  @Post('credenciamento/:turmaId')
  @ApiOperation({ summary: 'Credencia aluno na turma (check-in inicial do evento)' })
  credenciar(
    @Param('turmaId') turmaId: string,
    @Body() dto: CredenciarAlunoDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.credenciamento.credenciar(dto, turmaId, u);
  }

  @Post('checkin/qr')
  @ApiOperation({ summary: 'Check-in via QR Code (dias seguintes ao credenciamento)' })
  checkinQr(@Body() dto: CheckinQrDto, @Usuario() u: UsuarioLogado) {
    return this.credenciamento.checkinQr(dto, u);
  }

  @Get('matriculas/:id/qr')
  @ApiOperation({ summary: 'Gera token QR Code para o aluno (crachá / app)' })
  gerarQr(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.credenciamento.gerarQr(id, u);
  }

  // ================================================================
  // PRESENÇA
  // ================================================================

  @Post('presencas')
  @ApiOperation({ summary: 'Registra presença por aluno + dia + sessão' })
  registrarPresenca(@Body() dto: RegistrarPresencaDto, @Usuario() u: UsuarioLogado) {
    return this.credenciamento.registrarPresenca(dto, u);
  }

  // ================================================================
  // CONFIRMAÇÕES
  // ================================================================

  @Get('confirmacoes')
  @ApiOperation({ summary: 'Lista confirmações (filtro por matrícula, status, canal)' })
  listarConfirmacoes(@Query('matriculaId') matriculaId?: string, @Query('status') status?: string) {
    return this.confirmacoes.listar({ matriculaId, status });
  }

  @Post('confirmacoes')
  @ApiOperation({ summary: 'Registra contato de confirmação de participação' })
  registrarConfirmacao(@Body() dto: RegistrarConfirmacaoDto, @Usuario() u: UsuarioLogado) {
    return this.confirmacoes.registrar(dto, u);
  }

  @Patch('confirmacoes/:id/status')
  @ApiOperation({ summary: 'Atualiza status de uma confirmação (ex: respondido → confirmado)' })
  atualizarConfirmacao(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('resposta') resposta: string | undefined,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.confirmacoes.atualizarStatus(id, status, resposta, u);
  }

  // ================================================================
  // TRANSFERÊNCIAS
  // ================================================================

  @Post('transferencias')
  @ApiOperation({ summary: 'Solicita transferência de turma' })
  solicitarTransferencia(@Body() dto: SolicitarTransferenciaDto, @Usuario() u: UsuarioLogado) {
    return this.transferencias.solicitar(dto, u);
  }

  @Post('transferencias/:id/efetivar')
  @ApiOperation({ summary: 'Efetiva a transferência (escolhe turma destino e registra)' })
  efetivarTransferencia(
    @Param('id') id: string,
    @Body() dto: EfetivarTransferenciaDto,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.transferencias.efetivar(id, dto, u);
  }

  @Delete('transferencias/:id')
  @ApiOperation({ summary: 'Cancela uma solicitação de transferência' })
  cancelarTransferencia(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.transferencias.cancelar(id, u);
  }

  // ================================================================
  // MONITORES
  // ================================================================

  @Get('monitores')
  @ApiOperation({ summary: 'Lista monitores' })
  listarMonitores(@Query('status') status?: string, @Query('busca') busca?: string) {
    return this.monitores.listar({ status, busca });
  }

  @Post('monitores')
  @ApiOperation({ summary: 'Cadastra novo monitor' })
  criarMonitor(@Body() dto: CriarMonitorDto, @Usuario() u: UsuarioLogado) {
    return this.monitores.criar(dto, u);
  }

  @Post('monitores/escala')
  @ApiOperation({ summary: 'Escala monitor em uma turma' })
  escalarMonitor(@Body() dto: EscalarMonitorDto, @Usuario() u: UsuarioLogado) {
    return this.monitores.escalar(dto, u);
  }

  @Patch('monitores/escala/:id/kit')
  @ApiOperation({ summary: 'Marca kit/colete como entregue ao monitor' })
  marcarKitEntregue(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.monitores.marcarKitEntregue(id, u);
  }

  @Delete('monitores/escala/:id')
  @ApiOperation({ summary: 'Remove a escala de um monitor em uma turma (hard delete do vínculo)' })
  removerEscala(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.monitores.removerEscala(id, u);
  }

  @Delete('monitores/:id')
  @ApiOperation({ summary: 'Inativa um monitor — soft-delete via status inativo' })
  removerMonitor(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.monitores.remover(id, u);
  }

  // ================================================================
  // SOLICITAÇÕES (SECRETARIA)
  // ================================================================

  @Get('solicitacoes')
  @ApiOperation({ summary: 'Lista solicitações (certificado, transferência, suporte...)' })
  listarSolicitacoes(@Query('status') status?: string, @Query('tipo') tipo?: string, @Query('pessoaId') pessoaId?: string) {
    return this.solicitacoes.listar({ status, tipo, pessoaId });
  }

  @Post('solicitacoes')
  @ApiOperation({ summary: 'Abre nova solicitação' })
  criarSolicitacao(@Body() dto: CriarSolicitacaoDto, @Usuario() u: UsuarioLogado) {
    return this.solicitacoes.criar(dto, u);
  }

  @Patch('solicitacoes/:id/status')
  @ApiOperation({ summary: 'Atualiza status da solicitação' })
  atualizarSolicitacao(
    @Param('id') id: string,
    @Body('status') status: string,
    @Body('resposta') resposta: string | undefined,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.solicitacoes.atualizarStatus(id, status, resposta, u);
  }

  @Delete('solicitacoes/:id')
  @ApiOperation({ summary: 'Remove uma solicitação (hard delete)' })
  removerSolicitacao(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.solicitacoes.remover(id, u);
  }

  // ================================================================
  // CUSTOMER SUCCESS
  // ================================================================

  @Get('cs')
  @ApiOperation({ summary: 'Lista acompanhamentos de CS (alunos que exigem atenção)' })
  listarCs(@Query('status') status?: string, @Query('motivo') motivo?: string, @Query('responsavelId') responsavelId?: string) {
    return this.cs.listar({ status, motivo, responsavelId });
  }

  @Post('cs')
  @ApiOperation({ summary: 'Abre acompanhamento de Customer Success' })
  criarCs(
    @Body() body: { matriculaId?: string; pessoaId: string; pessoaNome?: string; motivo: string; prioridade?: string; proxima_acao?: string; prazo?: string; observacoes?: string; responsavelId?: string },
    @Usuario() u: UsuarioLogado,
  ) {
    return this.cs.criar(body, u);
  }

  @Patch('cs/:id')
  @ApiOperation({ summary: 'Atualiza acompanhamento de CS' })
  atualizarCs(
    @Param('id') id: string,
    @Body() body: any,
    @Usuario() u: UsuarioLogado,
  ) {
    return this.cs.atualizar(id, body, u);
  }

  @Delete('cs/:id')
  @ApiOperation({ summary: 'Descarta um acompanhamento de CS — soft-delete via status descartado' })
  removerCs(@Param('id') id: string, @Usuario() u: UsuarioLogado) {
    return this.cs.remover(id, u);
  }
}
