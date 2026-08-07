/**
 * Rotas dos Agentes de IA.
 *
 * Três públicos distintos:
 *  - ADMIN (setor 'geral'): parear/desparear, gerar token, listar agentes;
 *  - USUÁRIO do setor 'crm' (e admin): conversar com os agentes;
 *  - A PLATAFORMA (sem sessão): manifesto e pair autenticados pelo token de
 *    conexão; webhook autenticado por HMAC — os três com @Publica(), porque
 *    quem chama não tem cookie do FebraHub.
 */
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
  Sse,
} from '@nestjs/common';
import { ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyReply, FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Publica } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AgentesService, PRIORIDADES, STATUS_KANBAN } from './agentes.service';
import { AgentesEventos } from './agentes.eventos';

class NovaConversaDto {
  @IsString() @MinLength(2) @MaxLength(4000) mensagem!: string;
  @IsOptional() @IsString() @MaxLength(80) agenteId?: string;
  @IsOptional() @IsString() @MaxLength(160) agenteNome?: string;
  /** Rota do FebraHub de onde a conversa nasceu (contexto do widget). */
  @IsOptional() @IsString() @MaxLength(300) contexto?: string;
}

class MensagemDto {
  @IsString() @MinLength(1) @MaxLength(4000) conteudo!: string;
}

class EditarConversaDto {
  @IsOptional() @IsIn([...PRIORIDADES]) prioridade?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(12) @IsString({ each: true }) etiquetas?: string[];
  /** `null` limpa o responsável; ausente não mexe. */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() responsavelId?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() crmClienteId?: string | null;
}

class MoverConversaDto {
  @IsIn([...STATUS_KANBAN]) status!: string;
}

class PairDto {
  @IsString() aplopes_token!: string;
  @IsString() aplopes_base_url!: string;
  @IsOptional() @IsString() webhook_secret?: string;
  @IsString() workspace_id!: string;
  @IsOptional() @IsString() workspace_name?: string;
}

@ApiTags('agentes')
@Controller('agentes')
export class AgentesController {
  constructor(
    private readonly agentes: AgentesService,
    private readonly eventos: AgentesEventos,
  ) {}

  /* ---------------- administração (setor geral) ---------------- */

  @Get('conexao')
  @ExigePermissao('agentes.gerenciar')
  @ApiOperation({ summary: 'Estado do pareamento (sem segredos)' })
  conexao() {
    return this.agentes.statusConexao();
  }

  @Post('conexao/token')
  @ExigePermissao('agentes.gerenciar')
  @ApiOperation({ summary: 'Gera o token fhk_live_ para colar no Aplopes (só o hash fica)' })
  gerarToken(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest) {
    return this.agentes.gerarTokenConexao(u, req.ip);
  }

  @Get('lista')
  @ExigePermissao('agentes.gerenciar')
  @ApiOperation({ summary: 'Agentes do workspace pareado' })
  listar() {
    return this.agentes.listarAgentes();
  }

  @Delete('conexao')
  @ExigePermissao('agentes.gerenciar')
  @HttpCode(204)
  async desparear(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest) {
    await this.agentes.desparear(u, req.ip);
  }

  /* ---------------- conversas (setor crm) ---------------- */

  @Get('conversas')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Lista com não-lidas, última mensagem e filtros' })
  conversas(
    @Query('status') status?: string,
    @Query('agente') agenteId?: string,
    @Query('responsavel') responsavelId?: string,
    @Query('prioridade') prioridade?: string,
    @Query('etiqueta') etiqueta?: string,
    @Query('busca') busca?: string,
    @Query('naoLidas') naoLidas?: string,
  ) {
    return this.agentes.listarConversas({
      status, agenteId, responsavelId, prioridade, etiqueta, busca,
      naoLidas: naoLidas === '1',
    });
  }

  @Get('conversas/resumo')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Contadores por etapa + total de não-lidas' })
  resumo() {
    return this.agentes.resumoConversas();
  }

  @Get('usuarios')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Usuários ativos para atribuição de responsável' })
  usuarios() {
    return this.agentes.usuariosAtribuiveis();
  }

  /** Tempo real (mesmo desenho da origem): SSE in-process com heartbeat; o
   *  cliente cai para polling quando o stream morre. */
  @Sse('eventos')
  @ExigeSetor('crm')
  @ApiExcludeEndpoint()
  eventosSse() {
    return this.eventos.stream();
  }

  @Post('conversas')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Abre uma conversa com o agente (cria a issue remota)' })
  criar(@Usuario() u: UsuarioLogado, @Body() dado: NovaConversaDto) {
    return this.agentes.criarConversa(u, dado.mensagem, dado.agenteId, dado.agenteNome, dado.contexto);
  }

  @Get('conversas/:id/mensagens')
  @ExigeSetor('crm')
  mensagens(@Param('id', ParseUUIDPipe) id: string, @Query('ler') ler?: string) {
    return this.agentes.mensagens(id, ler !== '0');
  }

  @Post('conversas/:id/mensagens')
  @ExigeSetor('crm')
  enviar(@Param('id', ParseUUIDPipe) id: string, @Body() dado: MensagemDto) {
    return this.agentes.enviarMensagem(id, dado.conteudo);
  }

  @Post('conversas/:id/lida')
  @ExigeSetor('crm')
  @HttpCode(200)
  marcarLida(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentes.marcarLida(id);
  }

  @Patch('conversas/:id')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Prioridade, etiquetas, responsável e vínculo com o CRM (locais)' })
  editar(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: EditarConversaDto,
    @Req() req: FastifyRequest,
  ) {
    return this.agentes.atualizarConversa(u, id, dado, req.ip);
  }

  @Post('conversas/:id/mover')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Move no kanban (persiste local + espelha na plataforma)' })
  mover(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: MoverConversaDto,
    @Req() req: FastifyRequest,
  ) {
    return this.agentes.moverConversa(u, id, dado.status, req.ip);
  }

  @Post('conversas/:id/concluir')
  @ExigeSetor('crm')
  concluir(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.agentes.concluirConversa(u, id, req.ip);
  }

  @Post('conversas/:id/reabrir')
  @ExigeSetor('crm')
  reabrir(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.agentes.reabrirConversa(u, id, req.ip);
  }

  @Post('conversas/:id/cancelar')
  @ExigeSetor('crm')
  cancelar(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Req() req: FastifyRequest) {
    return this.agentes.cancelarConversa(u, id, req.ip);
  }

  @Post('conversas/:id/anexos')
  @ExigeSetor('crm')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envia até 5 arquivos (10 MB cada) para a conversa remota' })
  async anexar(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const arquivos: { nome: string; tipo: string; dados: Buffer }[] = [];
    let mensagem: string | undefined;
    const partes = (req as unknown as { parts: () => AsyncIterableIterator<MultipartFile | { type: 'field'; fieldname: string; value: unknown }> }).parts();
    for await (const parte of partes) {
      if (parte.type === 'file') {
        const arquivo = parte as MultipartFile;
        arquivos.push({
          nome: arquivo.filename ?? 'arquivo',
          tipo: arquivo.mimetype ?? 'application/octet-stream',
          dados: await arquivo.toBuffer(),
        });
      } else if (parte.fieldname === 'mensagem' && typeof parte.value === 'string') {
        mensagem = parte.value;
      }
    }
    return this.agentes.enviarAnexos(u, id, arquivos, mensagem);
  }

  @Get('conversas/:id/anexos/:artifactId')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Baixa um anexo (proxy autenticado; ?thumb=1 tenta a miniatura)' })
  async baixarAnexo(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('artifactId') artifactId: string,
    @Query('thumb') thumb: string | undefined,
    @Res() res: FastifyReply,
  ) {
    const anexo = await this.agentes.baixarAnexo(id, artifactId, thumb === '1');
    void res.header('Content-Type', anexo.contentType);
    void res.header('Cache-Control', 'private, max-age=300');
    void res.send(anexo.dados);
  }

  /* ---------------- superfície da plataforma (pública) ---------------- */

  @Post('pair')
  @Publica()
  @ApiExcludeEndpoint()
  parear(@Headers('authorization') authorization: string | undefined, @Body() dto: PairDto) {
    return this.agentes.parear(authorization, {
      aplopes_token: dto.aplopes_token,
      aplopes_base_url: dto.aplopes_base_url,
      webhook_secret: dto.webhook_secret ?? '',
      workspace_id: dto.workspace_id,
      workspace_name: dto.workspace_name,
    });
  }

  @Post('webhook')
  @Publica()
  @ApiExcludeEndpoint()
  webhook(
    @Headers('x-alook-signature') assinatura: string | undefined,
    @Headers('x-alook-timestamp') timestamp: string | undefined,
    @Req() req: RawBodyRequest<FastifyRequest>,
  ) {
    const raw = req.rawBody ? req.rawBody.toString('utf8') : JSON.stringify(req.body ?? {});
    return this.agentes.processarWebhook(assinatura, timestamp, raw);
  }
}

/**
 * O manifesto vive FORA do prefixo /api (o Aplopes lê
 * /.well-known/aplopes-integration na raiz do domínio).
 */
@Controller('/.well-known')
export class AgentesManifestoController {
  constructor(private readonly agentes: AgentesService) {}

  @Get('aplopes-integration')
  @Publica()
  @ApiExcludeEndpoint()
  manifesto(@Headers('authorization') authorization: string | undefined, @Req() req: FastifyRequest) {
    const proto = (req.headers['x-forwarded-proto'] as string | undefined) ?? 'https';
    const host = (req.headers['x-forwarded-host'] as string | undefined) ?? req.headers.host ?? '';
    return this.agentes.manifesto(authorization, `${proto}://${host}`);
  }
}
