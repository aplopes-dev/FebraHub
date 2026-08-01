import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { FastifyReply, FastifyRequest } from 'fastify';
import { AuthService } from './auth.service';
import { EntrarDto, TrocarSenhaDto } from './dto/auth.dto';
import { Publica, Usuario, UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { COOKIE_ACESSO, COOKIE_REFRESH } from '../../common/guards/sessao.guard';
import { Configuracao } from '../../config/configuracao';
import { PrismaService } from '../../database/prisma.service';

type Req = FastifyRequest & { cookies?: Record<string, string> };

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  private readonly cfg: Configuracao;

  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.cfg = config.get<Configuracao>('app')!;
  }

  @Publica()
  @Post('entrar')
  @HttpCode(200)
  // Limite apertado: login é a porta que sofre força bruta. O AuthService
  // ainda bloqueia por e-mail e por IP; isto é a primeira barreira.
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Autentica e abre sessão em cookie httpOnly' })
  async entrar(@Body() dto: EntrarDto, @Req() req: Req, @Res({ passthrough: true }) res: FastifyReply) {
    const r = await this.auth.entrar(dto.email, dto.senha, ipDe(req), agenteDe(req));
    this.gravarCookies(res, r.acesso, r.refresh);
    await this.auditar(r.perfil.id, 'login', 'auth', ipDe(req));
    return { perfil: r.perfil, precisaTrocarSenha: r.precisaTrocarSenha };
  }

  @Publica()
  @Post('refresh')
  @HttpCode(200)
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Renova a sessão a partir do refresh (rotativo)' })
  async refresh(@Req() req: Req, @Res({ passthrough: true }) res: FastifyReply) {
    const atual = req.cookies?.[COOKIE_REFRESH] ?? '';
    const r = await this.auth.renovar(atual, ipDe(req), agenteDe(req));
    this.gravarCookies(res, r.acesso, r.refresh);
    return { perfil: r.perfil };
  }

  @Publica()
  @Post('sair')
  @HttpCode(204)
  @ApiOperation({ summary: 'Encerra a sessão e limpa os cookies' })
  async sair(@Req() req: Req, @Res({ passthrough: true }) res: FastifyReply) {
    await this.auth.sair(req.cookies?.[COOKIE_REFRESH]);
    // Limpar o cookie exige as MESMAS opções com que ele foi gravado; sem
    // path e domain iguais o browser mantém o antigo e a sessão "não sai".
    const base = this.opcoesCookie(0);
    void res.clearCookie(COOKIE_ACESSO, base);
    void res.clearCookie(COOKIE_REFRESH, { ...base, path: '/api/auth' });
  }

  @Get('eu')
  @ApiOperation({ summary: 'Perfil da sessão atual' })
  async eu(@Usuario() usuario: UsuarioLogado) {
    // Relê do banco: setor e papel podem ter mudado depois do token emitido,
    // e o menu do front é montado a partir daqui.
    const fresco = await this.auth.perfilDe(usuario.id);
    return { perfil: fresco ?? usuario };
  }

  @Post('senha')
  @HttpCode(204)
  @Throttle({ default: { limit: 5, ttl: 300_000 } })
  @ApiOperation({ summary: 'Troca a própria senha (encerra as outras sessões)' })
  async trocarSenha(
    @Usuario() usuario: UsuarioLogado,
    @Body() dto: TrocarSenhaDto,
    @Req() req: Req,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    await this.auth.trocarSenha(usuario.id, dto.atual, dto.nova);
    await this.auditar(usuario.id, 'troca_senha', 'auth', ipDe(req));
    // A troca revogou tudo, inclusive esta sessão: reemitimos para quem trocou
    // não ser deslogado no meio do próprio fluxo.
    const r = await this.auth.emitirTokens(usuario, ipDe(req), agenteDe(req));
    this.gravarCookies(res, r.acesso, r.refresh);
  }

  private gravarCookies(res: FastifyReply, acesso: string, refresh: string): void {
    void res.setCookie(COOKIE_ACESSO, acesso, this.opcoesCookie(15 * 60));
    // O refresh só é enviado para /api/auth: não há motivo para ele passear
    // junto de toda requisição de dados.
    void res.setCookie(COOKIE_REFRESH, refresh, {
      ...this.opcoesCookie(30 * 24 * 3600),
      path: '/api/auth',
    });
  }

  private opcoesCookie(maxAge: number) {
    return {
      httpOnly: true,
      secure: this.cfg.cookie.seguro, // só em produção; em dev o host é http
      sameSite: 'lax' as const, // front e API no mesmo domínio
      path: '/',
      maxAge,
      ...(this.cfg.cookie.dominio ? { domain: this.cfg.cookie.dominio } : {}),
    };
  }

  private async auditar(usuarioId: string, acao: string, recurso: string, ip: string) {
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId, acao, recurso, ip: ip.slice(0, 60) } })
      .catch(() => undefined);
  }
}

/** O Nginx do host repassa o IP real; sem isso todo mundo vira 127.0.0.1. */
function ipDe(req: FastifyRequest): string {
  const encaminhado = req.headers['x-forwarded-for'];
  if (typeof encaminhado === 'string' && encaminhado) return encaminhado.split(',')[0].trim();
  return req.ip ?? 'desconhecido';
}

function agenteDe(req: FastifyRequest): string {
  const ua = req.headers['user-agent'];
  return typeof ua === 'string' ? ua : 'desconhecido';
}
