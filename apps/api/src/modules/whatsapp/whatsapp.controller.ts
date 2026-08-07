/**
 * Rotas do WhatsApp. Conexão (QR/conectar/desconectar) é operação de
 * administração — setor 'geral', como as demais integrações. O inbox de
 * conversas é do time do CRM (setor 'crm'): é lá que a conversa vira
 * cliente, negócio e tarefa.
 */
import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req, Sse } from '@nestjs/common';
import { ApiConsumes, ApiExcludeEndpoint, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import type { MultipartFile } from '@fastify/multipart';
import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { WhatsappService } from './whatsapp.service';
import { WhatsappEventos } from './whatsapp.eventos';

class EnviarDto {
  @IsString() @MinLength(1) @MaxLength(4000) texto!: string;
  /** provider id da mensagem citada (responder). */
  @IsOptional() @IsString() @MaxLength(120) citacaoId?: string;
}

class VincularDto {
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsBoolean() criarNovo?: boolean;
}

class EditarConversaWaDto {
  @IsOptional() @IsIn(['aberta', 'pendente', 'fechada']) status?: string;
  /** `null` tira o responsável; ausente não mexe. */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() responsavelId?: string | null;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly whatsapp: WhatsappService,
    private readonly eventos: WhatsappEventos,
  ) {}

  /* ---------- conexão (admin/geral) ---------- */

  @Get('status')
  @ExigePermissao('whatsapp.gerenciar')
  @ApiOperation({ summary: 'Estado da conexão (inclui o QR quando pendente)' })
  status() {
    return this.whatsapp.status();
  }

  @Post('conectar')
  @ExigePermissao('whatsapp.gerenciar')
  @ApiOperation({ summary: 'Inicia a conexão Baileys — o QR aparece no status' })
  conectar() {
    return this.whatsapp.conectar();
  }

  @Post('desconectar')
  @ExigePermissao('whatsapp.gerenciar')
  @ApiOperation({ summary: 'Desliga a sessão e apaga as credenciais do disco' })
  desconectar() {
    return this.whatsapp.desconectar();
  }

  /* ---------- inbox (setor crm) ---------- */

  @Get('conversas')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Conversas com filtros (escopo/situação/não-lidas/busca)' })
  conversas(
    @Usuario() u: UsuarioLogado,
    @Query('busca') busca?: string,
    @Query('status') status?: string,
    @Query('escopo') escopo?: string,
    @Query('naoLidas') naoLidas?: string,
    @Query('responsavel') responsavelId?: string,
  ) {
    return this.whatsapp.conversas(u, {
      busca, status,
      escopo: escopo === 'minhas' || escopo === 'nao_atribuidas' ? escopo : undefined,
      naoLidas: naoLidas === '1',
      responsavelId,
    });
  }

  /** Tempo real do inbox (SSE; heartbeat 25s; o cliente cai pra polling). */
  @Sse('eventos')
  @ExigeSetor('crm')
  @ApiExcludeEndpoint()
  eventosSse() {
    return this.eventos.stream();
  }

  @Patch('conversas/:id')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Situação (aberta/pendente/fechada) e responsável' })
  async editar(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dado: EditarConversaWaDto,
  ) {
    let conversa = null;
    if (dado.status !== undefined) conversa = await this.whatsapp.mudarStatus(u, id, dado.status);
    if (dado.responsavelId !== undefined) conversa = await this.whatsapp.atribuir(u, id, dado.responsavelId);
    return conversa ?? this.whatsapp.mensagens(id, false).then((r) => r.conversa);
  }

  @Get('conversas/nao-lidas')
  @ExigeSetor('crm')
  naoLidas() {
    return this.whatsapp.totalNaoLidas();
  }

  @Get('conversas/:id/mensagens')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Thread da conversa (?ler=1 zera as não lidas)' })
  mensagens(@Param('id', ParseUUIDPipe) id: string, @Query('ler') ler?: string) {
    return this.whatsapp.mensagens(id, ler === '1');
  }

  @Post('conversas/:id/mensagens')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Envia texto pela conexão ativa (citacaoId responde uma mensagem)' })
  enviar(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: EnviarDto) {
    return this.whatsapp.enviar(u, id, dado.texto, dado.citacaoId);
  }

  @Post('conversas/:id/midia')
  @ExigeSetor('crm')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Envia mídia (imagem/vídeo/áudio/documento; notaVoz=1 manda como voz)' })
  async enviarMidia(
    @Usuario() u: UsuarioLogado,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    let arquivo: { nome: string; mime: string; dados: Buffer } | null = null;
    let legenda: string | undefined;
    let notaVoz = false;
    const partes = (req as unknown as { parts: () => AsyncIterableIterator<MultipartFile | { type: 'field'; fieldname: string; value: unknown }> }).parts();
    for await (const parte of partes) {
      if (parte.type === 'file') {
        const f = parte as MultipartFile;
        arquivo = {
          nome: f.filename ?? 'arquivo',
          mime: f.mimetype ?? 'application/octet-stream',
          dados: await f.toBuffer(),
        };
      } else if (parte.fieldname === 'legenda' && typeof parte.value === 'string') {
        legenda = parte.value;
      } else if (parte.fieldname === 'notaVoz') {
        notaVoz = parte.value === '1' || parte.value === 'true';
      }
    }
    if (!arquivo) {
      return this.whatsapp.enviar(u, id, legenda ?? '');
    }
    return this.whatsapp.enviarMidia(u, id, arquivo, legenda, notaVoz);
  }

  @Post('conversas/:id/cliente')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Vincula a um cliente do CRM (ou cria um lead PF da conversa)' })
  vincular(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: VincularDto) {
    return this.whatsapp.vincularCliente(u, id, dado.clienteId ?? null, dado.criarNovo === true);
  }

  @Get('mensagens/:id/midia')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'URL assinada da mídia re-hospedada no MinIO' })
  midia(@Param('id', ParseUUIDPipe) id: string) {
    return this.whatsapp.urlMidia(id);
  }
}
