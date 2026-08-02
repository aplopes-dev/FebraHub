/**
 * Rotas do WhatsApp. Conexão (QR/conectar/desconectar) é operação de
 * administração — setor 'geral', como as demais integrações. O inbox de
 * conversas é do time do CRM (setor 'crm'): é lá que a conversa vira
 * cliente, negócio e tarefa.
 */
import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ExigeSetor } from '../../common/guards/setor.guard';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { WhatsappService } from './whatsapp.service';

class EnviarDto {
  @IsString() @MinLength(1) @MaxLength(4000) texto!: string;
}

class VincularDto {
  @IsOptional() @IsUUID() clienteId?: string;
  @IsOptional() @IsBoolean() criarNovo?: boolean;
}

@ApiTags('whatsapp')
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsapp: WhatsappService) {}

  /* ---------- conexão (admin/geral) ---------- */

  @Get('status')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Estado da conexão (inclui o QR quando pendente)' })
  status() {
    return this.whatsapp.status();
  }

  @Post('conectar')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Inicia a conexão Baileys — o QR aparece no status' })
  conectar() {
    return this.whatsapp.conectar();
  }

  @Post('desconectar')
  @ExigeSetor('geral')
  @ApiOperation({ summary: 'Desliga a sessão e apaga as credenciais do disco' })
  desconectar() {
    return this.whatsapp.desconectar();
  }

  /* ---------- inbox (setor crm) ---------- */

  @Get('conversas')
  @ExigeSetor('crm')
  @ApiOperation({ summary: 'Conversas ordenadas pela última mensagem, com o cliente vinculado' })
  conversas() {
    return this.whatsapp.conversas();
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
  @ApiOperation({ summary: 'Envia texto pela conexão ativa' })
  enviar(@Usuario() u: UsuarioLogado, @Param('id', ParseUUIDPipe) id: string, @Body() dado: EnviarDto) {
    return this.whatsapp.enviar(u, id, dado.texto);
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
