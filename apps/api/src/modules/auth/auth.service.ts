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
import { Configuracao, ttlMs } from '../../config/configuracao';
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

  /**
   * Gera o par acesso+refresh e guarda só o hash do refresh (ver renovar).
   *
   * `teto` é o limite absoluto da família de sessões (padrão do Veicular): o
   * vencimento do refresh DESLIZA a cada rotação (+refreshTtl), mas nunca
   * ultrapassa o teto que nasceu no login. Sem ele, uma sessão renovada em
   * dia útil viveria para sempre.
   */
  async emitirTokens(
    perfil: UsuarioLogado,
    ip: string,
    agente: string,
    opts?: { jti?: string; teto?: Date },
  ) {
    // expiresIn vai em SEGUNDOS. A forma "15m" existe, mas o tipo dela é um
    // literal fechado (`StringValue`) e um TTL vindo de env nunca satisfaz —
    // converter aqui evita o cast que esconderia um TTL inválido.
    const acesso = await this.jwt.signAsync(
      { ...perfil, tipo: 'acesso' },
      { secret: this.cfg.jwt.acessoSegredo, expiresIn: ttlMs(this.cfg.jwt.acessoTtl) / 1000 },
    );

    const teto = opts?.teto ?? new Date(Date.now() + ttlMs(this.cfg.jwt.sessaoTetoTtl));
    const desliza = new Date(Date.now() + ttlMs(this.cfg.jwt.refreshTtl));
    const expiraEm = desliza < teto ? desliza : teto;

    const jti = opts?.jti ?? novoJti();
    const refresh = await this.jwt.signAsync(
      { id: perfil.id, jti, tipo: 'refresh' },
      {
        secret: this.cfg.jwt.refreshSegredo,
        expiresIn: Math.max(1, Math.ceil((expiraEm.getTime() - Date.now()) / 1000)),
      },
    );

    await this.prisma.sessao.create({
      data: {
        id: jti,
        usuarioId: perfil.id,
        tokenHash: sha256(refresh),
        ip: ip.slice(0, 60),
        agente: agente.slice(0, 250),
        expiraEm,
        absolutaExpiraEm: teto,
      },
    });

    return { acesso, refresh };
  }

  /**
   * Renova a sessão com rotação obrigatória e corrida benigna (padrão do
   * Veicular). Duas requisições que competem pelo MESMO refresh (multi-aba,
   * retry em voo, resposta perdida na rede) são resolvidas pelo CAS
   * `updateMany({ where: { id, revogadaEm: null } })`: quem perde a corrida
   * (count = 0) reemite uma sessão nova mesmo assim — ninguém é derrubado por
   * uma corrida legítima. Já um token que chega REVOGADO NA LEITURA é sempre
   * reuso (vazamento) ou revogação explícita (logout/troca de senha), e aí a
   * resposta é derrubar todas as sessões do usuário e exigir novo login.
   * Era exatamente essa distinção que faltava: a versão anterior tratava a
   * corrida benigna como vazamento e revogava tudo — a "sessão que expira
   * sozinha" nascia aqui.
   */
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
    if (!sessao || sessao.tokenHash !== sha256(refresh)) {
      // Assinatura válida mas registro desconhecido (ou hash divergente):
      // token de um banco que não é este. Não há o que revogar com segurança.
      throw new UnauthorizedException({ codigo: 'REFRESH_INVALIDO', message: 'Sessão expirada' });
    }
    if (sessao.revogadaEm) {
      // Revogado ANTES desta chamada — sem corrida em curso aqui. Reuso de um
      // token já trocado (substituidaPor aponta o sucessor) ou já deslogado.
      await this.revogarTodas(sessao.usuarioId);
      await this.auditar(sessao.usuarioId, 'refresh_reuso', ip);
      this.logger.warn(
        `refresh reusado (sessão ${sessao.id.slice(0, 8)}…, usuário ${sessao.usuarioId}) — todas as sessões revogadas`,
      );
      throw new UnauthorizedException({ codigo: 'REFRESH_REUSO', message: 'Sessão encerrada' });
    }
    const agora = new Date();
    if (sessao.expiraEm < agora || (sessao.absolutaExpiraEm && sessao.absolutaExpiraEm < agora)) {
      throw new UnauthorizedException({ codigo: 'REFRESH_EXPIRADO', message: 'Sessão expirada' });
    }

    const usuario = await this.prisma.usuario.findUnique({
      where: { id: sessao.usuarioId },
      include: { setores: true },
    });
    if (!usuario || !usuario.ativo) {
      throw new UnauthorizedException({ codigo: 'USUARIO_INATIVO', message: 'Usuário inativo' });
    }

    // Rotação via CAS: o id do sucessor é gerado ANTES para ficar gravado no
    // antecessor — é a trilha de auditoria da cadeia de rotações.
    const jti = novoJti();
    await this.prisma.sessao.updateMany({
      where: { id: sessao.id, revogadaEm: null },
      data: { revogadaEm: agora, substituidaPor: jti },
    });
    // count 0 = outra renovação venceu a corrida NESTE instante. Reemitimos
    // do mesmo jeito (o browser fica com o último Set-Cookie); derrubar aqui
    // é o que deslogava quem só tinha duas abas abertas.

    const perfil = this.montarPerfil(usuario);
    // Sessões de antes da migração não têm teto: começa a contar agora.
    const teto = sessao.absolutaExpiraEm ?? new Date(Date.now() + ttlMs(this.cfg.jwt.sessaoTetoTtl));
    return { perfil, ...(await this.emitirTokens(perfil, ip, agente, { jti, teto })) };
  }

  async sair(refresh?: string, ip = ''): Promise<void> {
    if (!refresh) return;
    try {
      const carga = await this.jwt.verifyAsync<{ id?: string; jti: string }>(refresh, {
        secret: this.cfg.jwt.refreshSegredo,
      });
      await this.prisma.sessao.updateMany({
        where: { id: carga.jti, revogadaEm: null },
        data: { revogadaEm: new Date() },
      });
      if (carga.id) await this.auditar(carga.id, 'logout', ip);
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

  /** Trilha de segurança (reuso de refresh, revogações em massa). */
  private async auditar(usuarioId: string, acao: string, ip: string): Promise<void> {
    await this.prisma.auditoriaAcesso
      .create({ data: { usuarioId, acao, recurso: 'auth', ip: ip.slice(0, 60) } })
      .catch(() => undefined);
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

const novoJti = () => randomBytes(24).toString('hex');
