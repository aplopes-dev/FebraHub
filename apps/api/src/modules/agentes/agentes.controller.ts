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
  Post,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Publica } from '../../common/decorators/usuario.decorator';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AgentesService } from './agentes.service';

class NovaConversaDto {
  @IsString() @MinLength(2) @MaxLength(4000) mensagem!: string;
  @IsOptional() @IsString() @MaxLength(80) agenteId?: string;
}

class MensagemDto {
  @IsString() @MinLength(1) @MaxLength(4000) conteudo!: string;
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
  constructor(private readonly agentes: AgentesService) {}

  /* ---------------- administração (setor geral) ---------------- */

  @Get('conexao')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Estado do pareamento (sem segredos)' })
  conexao() {
    return this.agentes.statusConexao();
  }

  @Post('conexao/token')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Gera o token fhk_live_ para colar no Aplopes (só o hash fica)' })
  gerarToken(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest) {
    return this.agentes.gerarTokenConexao(u, req.ip);
  }

  @Get('lista')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Agentes do workspace pareado' })
  listar() {
    return this.agentes.listarAgentes();
  }

  @Delete('conexao')
  @ExigeSetor('geral')
  @HttpCode(204)
  async desparear(@Usuario() u: UsuarioLogado, @Req() req: FastifyRequest) {
    await this.agentes.desparear(u, req.ip);
  }

  /* ---------------- conversas (setor crm) ---------------- */

  @Get('conversas')
  @ExigeSetor('crm')
  conversas() {
    return this.agentes.listarConversas();
  }

  @Post('conversas')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Abre uma conversa com o agente (cria a issue remota)' })
  criar(@Usuario() u: UsuarioLogado, @Body() dado: NovaConversaDto) {
    return this.agentes.criarConversa(u, dado.mensagem, dado.agenteId);
  }

  @Get('conversas/:id/mensagens')
  @ExigeSetor('crm')
  mensagens(@Param('id', ParseUUIDPipe) id: string) {
    return this.agentes.mensagens(id);
  }

  @Post('conversas/:id/mensagens')
  @ExigeSetor('crm')
  enviar(@Param('id', ParseUUIDPipe) id: string, @Body() dado: MensagemDto) {
    return this.agentes.enviarMensagem(id, dado.conteudo);
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
