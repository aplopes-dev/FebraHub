import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import { Configuracao } from '../../config/configuracao';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';

/** Argon2id com custo alinhado ao OWASP: 19 MiB, 2 passes. */
const ARGON: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19456,
  timeCost: 2,
  parallelism: 1,
};

const MAX_TENTATIVAS = 5;
const JANELA_MIN = 15;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly cfg: Configuracao;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    config: ConfigService,
  ) {
    this.cfg = config.get<Configuracao>('app')!;
  }

  async entrar(email: string, senha: string, ip: string, agente: string) {
    const chave = email.trim().toLowerCase();

    if (await this.bloqueado(chave, ip)) {
      throw new UnauthorizedException({
        codigo: 'MUITAS_TENTATIVAS',
        message: `Muitas tentativas. Tente de novo em ${JANELA_MIN} minutos.`,
      });
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { email: chave },
      include: { setores: true },
    });

    // Hash falso quando o usuário não existe: sem isso, "e-mail inexistente"
    // responde na hora e "senha errada" demora o argon2 inteiro — a diferença
    // de tempo revela quais e-mails são reais.
    const hash = usuario?.senhaHash ?? HASH_FALSO;
    const ok = await argon2.verify(hash, senha).catch(() => false);

    if (!usuario || !ok || !usuario.ativo) {
      await this.registrarTentativa(chave, ip, agente, false);
      // Mensagem única para os três casos, pelo mesmo motivo.
      throw new UnauthorizedException({
        codigo: 'CREDENCIAIS',
        message: 'E-mail ou senha incorretos.',
      });
    }

    if (argon2.needsRehash(hash, ARGON)) {
      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: { senhaHash: await argon2.hash(senha, ARGON) },
      });
    }

    await this.registrarTentativa(chave, ip, agente, true);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoLogin: new Date() },
    });

    const perfil = this.montarPerfil(usuario);
    return {
      perfil,
      precisaTrocarSenha: usuario.precisaTrocarSenha,
      ...(await this.emitirTokens(perfil, ip, agente)),
    };
  }

  /** Gera o par acesso+refresh e guarda só o hash do refresh (ver renovar). */
  async emitirTokens(perfil: UsuarioLogado, ip: string, agente: string) {
    const acesso = await this.jwt.signAsync(
      { ...perfil, tipo: 'acesso' },
      { secret: this.cfg.jwt.acessoSegredo, expiresIn: this.cfg.jwt.acessoTtl },
    );

    const jti = randomBytes(24).toString('hex');
    const refresh = await this.jwt.signAsync(
      { id: perfil.id, jti, tipo: 'refresh' },
      { secret: this.cfg.jwt.refreshSegredo, expiresIn: this.cfg.jwt.refreshTtl },
    );

    await this.prisma.sessao.create({
      data: {
        id: jti,
        usuarioId: perfil.id,
        tokenHash: sha256(refresh),
        ip: ip.slice(0, 60),
        agente: agente.slice(0, 250),
        expiraEm: new Date(Date.now() + ttlMs(this.cfg.jwt.refreshTtl)),
      },
    });

    return { acesso, refresh };
  }

  async renovar(refresh: string, ip: string, agente: string) {
    let carga: { id: string; jti: string; tipo?: string };
    try {
      carga = await this.jwt.verifyAsync(refresh, { secret: this.cfg.jwt.refreshSegredo });
    } catch {
      throw new UnauthorizedException({ codigo: 'REFRESH_INVALIDO', message: 'Sessão expirada' });
    }
    if (carga.tipo !== 'refresh') {
      throw new UnauthorizedException({ codigo: 'REFRESH_INVALIDO', message: 'Sessão expirada' });
    }

    const sessao = await this.prisma.sessao.findUnique({ where: { id: carga.jti } });
    // Refresh já usado, revogado ou desconhecido derruba a sessão inteira: é o
    // sinal de que o token vazou e alguém está reusando.
    if (!sessao || sessao.revogadaEm || sessao.tokenHash !== sha256(refresh)) {
      if (sessao) await this.revogarTodas(sessao.usuarioId);
      throw new UnauthorizedException({ codigo: 'REFRESH_REUSO', message: 'Sessão encerrada' });
    }
    if (sessao.expiraEm < new Date()) {
      throw new UnauthorizedException({ codigo: 'REFRESH_EXPIRADO', message: 'Sessão expirada' });
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: sessao.usuarioId },
      include: { setores: true },
    });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException({ codigo: 'USUARIO_INATIVO', message: 'Usuário inativo' });
    }

    // Rotação: o refresh antigo morre na emissão do novo.
    await this.prisma.sessao.update({
      where: { id: sessao.id },
      data: { revogadaEm: new Date() },
    });

    const perfil = this.montarPerfil(usuario);
    return { perfil, ...(await this.emitirTokens(perfil, ip, agente)) };
  }

  async sair(refresh?: string): Promise<void> {
    if (!refresh) return;
    try {
      const carga = await this.jwt.verifyAsync<{ jti: string }>(refresh, {
        secret: this.cfg.jwt.refreshSegredo,
      });
      await this.prisma.sessao.updateMany({
        where: { id: carga.jti, revogadaEm: null },
        data: { revogadaEm: new Date() },
      });
    } catch {
      // Sair com token podre não é erro: o cliente já está indo embora.
    }
  }

  async revogarTodas(usuarioId: string): Promise<void> {
    await this.prisma.sessao.updateMany({
      where: { usuarioId, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }

  async trocarSenha(usuarioId: string, atual: string, nova: string): Promise<void> {
    if (nova.length < 10) {
      throw new BadRequestException({
        codigo: 'SENHA_CURTA',
        message: 'A nova senha precisa de ao menos 10 caracteres',
      });
    }
    const u = await this.prisma.usuario.findUnique({ where: { id: usuarioId } });
    if (!u || !(await argon2.verify(u.senhaHash, atual).catch(() => false))) {
      throw new UnauthorizedException({ codigo: 'SENHA_ATUAL', message: 'Senha atual incorreta' });
    }
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { senhaHash: await argon2.hash(nova, ARGON), precisaTrocarSenha: false },
    });
    // Trocar a senha encerra as outras sessões — é o que se espera de
    // "mudei a senha porque acho que entraram na minha conta".
    await this.revogarTodas(usuarioId);
  }

  async perfilDe(usuarioId: string): Promise<UsuarioLogado | null> {
    const u = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
      include: { setores: true },
    });
    return u && u.ativo ? this.montarPerfil(u) : null;
  }

  static async hashSenha(senha: string): Promise<string> {
    return argon2.hash(senha, ARGON);
  }

  private montarPerfil(u: {
    id: string;
    email: string;
    nome: string;
    papel: string;
    setor: string;
    setores: { setor: string }[];
  }): UsuarioLogado {
    return {
      id: u.id,
      email: u.email,
      nome: u.nome,
      papel: u.papel as UsuarioLogado['papel'],
      setor: u.setor,
      setores: [...new Set([u.setor, ...u.setores.map((s) => s.setor)])].filter(Boolean),
    };
  }

  private async bloqueado(email: string, ip: string): Promise<boolean> {
    const desde = new Date(Date.now() - JANELA_MIN * 60_000);
    const falhas = await this.prisma.tentativaLogin.count({
      where: { email, sucesso: false, criadoEm: { gte: desde } },
    });
    if (falhas >= MAX_TENTATIVAS) return true;
    // Trava por IP também, senão basta variar o e-mail para continuar tentando.
    const porIp = await this.prisma.tentativaLogin.count({
      where: { ip, sucesso: false, criadoEm: { gte: desde } },
    });
    return porIp >= MAX_TENTATIVAS * 4;
  }

  private async registrarTentativa(
    email: string,
    ip: string,
    agente: string,
    sucesso: boolean,
  ): Promise<void> {
    await this.prisma.tentativaLogin
      .create({ data: { email, ip: ip.slice(0, 60), agente: agente.slice(0, 250), sucesso } })
      .catch((e) => this.logger.warn(`falha ao registrar tentativa: ${e}`));

    if (sucesso) {
      await this.prisma.tentativaLogin
        .deleteMany({ where: { email, sucesso: false } })
        .catch(() => undefined);
    }
  }
}

const sha256 = (v: string) => createHash('sha256').update(v).digest('hex');

/** Hash de uma senha aleatória, fixo, só para gastar o mesmo tempo do caminho real. */
const HASH_FALSO =
  '$argon2id$v=19$m=19456,t=2,p=1$c2FsZ2FkbzEyMzQ1Njc4$JmZKq4kK0kV5cJHhkoSdN0mS1sSMWRp4cYs5FTNQnpY';

function ttlMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) return 30 * 24 * 3600_000;
  const n = Number(m[1]);
  return n * { s: 1000, m: 60_000, h: 3600_000, d: 86_400_000 }[m[2] as 's' | 'm' | 'h' | 'd'];
}
