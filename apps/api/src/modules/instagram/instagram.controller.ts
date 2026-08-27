/**
 * Instagram (login direto via sidecar aiograpi-rest) — dentro do hub Marketing.
 *
 * Complementa o Zernio (social.controller): o Zernio publica/agenda pelas contas
 * autorizadas; aqui é a conta conectada por login direto, com acesso à API
 * privada (DMs, mídia, stories, insights). Reusa as MESMAS permissões de redes
 * sociais — a conta é uma só, da Febracis Salvador, e não há recorte por setor.
 *
 * A senha/sessão NUNCA saem da API: o status devolve só usuário + estado, e as
 * chamadas cruas passam pelo proxy do servidor (a sessão vai cifrada no banco).
 */
import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsIn, IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { ExigePermissao } from '../../common/guards/permissao.guard';
import { InstagramService } from './instagram.service';

const aparar = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

class ConectarDto {
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(120)
  usuario?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  senha?: string;

  /** Caminho avançado: importa uma sessão pronta (cookie sessionid do navegador). */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(4000)
  sessionid?: string;

  /** Código 2FA reenviado no login quando cai em TwoFactorRequired. */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(12)
  codigo?: string;
}

class DesafioDto {
  /** Vazio = re-login (desafio "aprovar no aparelho"); com código = 2FA/SMS. */
  @IsOptional()
  @Transform(aparar)
  @IsString()
  @MaxLength(12)
  codigo?: string;
}

class RequestDto {
  @IsOptional()
  @IsIn(['GET', 'POST', 'PATCH', 'PUT', 'DELETE'])
  metodo?: string;

  @Transform(aparar)
  @IsString()
  @MaxLength(400)
  path!: string;

  @IsOptional()
  @IsObject()
  query?: Record<string, string>;

  @IsOptional()
  @IsObject()
  body?: Record<string, unknown>;
}

class ThreadsDto {
  @IsOptional()
  @Transform(({ value }) => (value === undefined ? undefined : Number(value)))
  @IsInt()
  @Min(1)
  @Max(100)
  quantidade?: number;

  @IsOptional()
  @IsIn(['', 'flagged', 'unread'])
  filtro?: string;
}

@ApiTags('social')
@Controller('social/instagram')
export class InstagramController {
  constructor(private readonly instagram: InstagramService) {}

  @Get()
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Estado da conta do Instagram conectada (nunca devolve senha/sessão)' })
  @ApiOkResponse({ description: 'disponivel, configurado, conectado, precisaDesafio, usuario' })
  status() {
    return this.instagram.status();
  }

  @Post()
  @ExigePermissao('social.gerenciar')
  @ApiOperation({
    summary: 'Conecta a conta (usuário/senha + 2FA) ou importa um sessionid',
    description:
      'Com `sessionid`, importa uma sessão pronta (pula o checkpoint). Caso contrário, ' +
      'login por usuário/senha; se cair em desafio, a resposta traz status "needs_challenge".',
  })
  async conectar(@Usuario() u: UsuarioLogado, @Body() dto: ConectarDto) {
    if (dto.sessionid) {
      const r = await this.instagram.loginPorSessionId(
        { username: dto.usuario, sessionid: dto.sessionid },
        u.id,
      );
      return { status: r.status, ok: r.ok, error: r.error ?? null };
    }
    const r = await this.instagram.login(
      { username: (dto.usuario ?? '').trim(), password: dto.senha ?? '', verificationCode: dto.codigo },
      u.id,
    );
    return { status: r.status, ok: r.ok, error: r.error ?? null };
  }

  @Post('desafio')
  @ExigePermissao('social.gerenciar')
  @ApiOperation({ summary: 'Resolve o desafio (2FA/checkpoint) com o código, ou re-login sem código' })
  async desafio(@Usuario() u: UsuarioLogado, @Body() dto: DesafioDto) {
    const r = await this.instagram.resolverDesafio(dto.codigo, u.id);
    return { status: r.status, ok: r.ok, error: r.error ?? null };
  }

  @Delete()
  @ExigePermissao('social.gerenciar')
  @ApiOperation({ summary: 'Desconecta a conta (apaga sessão + credenciais cifradas)' })
  async desconectar() {
    await this.instagram.desconectar();
    return { ok: true };
  }

  @Get('threads')
  @ExigePermissao('social.ver')
  @ApiOperation({ summary: 'Caixa de entrada de DMs (threads) da conta conectada' })
  async threads(@Query() q: ThreadsDto) {
    const query: Record<string, string> = { amount: String(q.quantidade ?? 20) };
    if (q.filtro) query.selected_filter = q.filtro;
    return this.instagram.igApiRequest({ method: 'GET', path: '/direct/threads', query });
  }

  @Post('request')
  @ExigePermissao('social.publicar')
  @ApiOperation({
    summary: 'Chamada crua autenticada à API do Instagram (aiograpi-rest)',
    description:
      'Cobre toda a superfície do aiograpi-rest (DMs, mídia, stories, perfis, insights, busca). ' +
      '`path` começa com /. Em GET/DELETE use `query`; em POST/PATCH use `body` (enviado como form).',
  })
  request(@Body() dto: RequestDto) {
    return this.instagram.igApiRequest({
      method: dto.metodo,
      path: dto.path,
      query: dto.query,
      body: dto.body,
    });
  }
}
