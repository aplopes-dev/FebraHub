import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { PrismaService } from '../../database/prisma.service';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { AuthService } from '../auth/auth.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { CATALOGO_PERMISSOES, PERMISSOES, normalizarPermissoes, permissoesDesconhecidas } from './catalogo';
import { PERFIL_PADRAO_NOVO_USUARIO } from './perfis-padrao';
import {
  AtualizarPerfilDto,
  AtualizarUsuarioDto,
  CriarPerfilDto,
  CriarUsuarioDto,
} from './permissoes.dto';

const CAMPOS_PERFIL = {
  id: true,
  slug: true,
  nome: true,
  descricao: true,
  sistema: true,
  permissoes: true,
  criadoEm: true,
} as const;

const CAMPOS_USUARIO = {
  id: true,
  email: true,
  nome: true,
  papel: true,
  setor: true,
  ativo: true,
  ultimoLogin: true,
  criadoEm: true,
  perfilAcessoId: true,
  perfilAcesso: { select: { id: true, slug: true, nome: true } },
  setores: { select: { setor: true } },
} as const;

@Injectable()
export class PermissoesService implements OnModuleInit {
  private readonly logger = new Logger(PermissoesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacoes: NotificacoesService,
    // O AuthModule é @Global e exporta o service: nada a importar aqui, e
    // sem ciclo — o AuthService usa deste módulo apenas funções puras.
    private readonly auth: AuthService,
  ) {}

  /**
   * O perfil `admin` recebe TODA permissão do catálogo, sempre. Sem isto,
   * cada permissão nova nasceria negada até alguém lembrar de marcá-la — e a
   * pessoa que descobriria o esquecimento seria justamente a que não
   * consegue mais abrir a tela para corrigir.
   *
   * Falha em silêncio de propósito: a API precisa subir mesmo quando o banco
   * ainda não recebeu a migration (é o que acontece no primeiro `up` local).
   */
  async onModuleInit(): Promise<void> {
    try {
      const admin = await this.prisma.perfilAcesso.findUnique({ where: { slug: 'admin' } });
      if (!admin) return;
      const faltando = PERMISSOES.filter((p) => !admin.permissoes.includes(p));
      if (!faltando.length) return;
      await this.prisma.perfilAcesso.update({
        where: { id: admin.id },
        data: { permissoes: normalizarPermissoes([...admin.permissoes, ...faltando]) },
      });
      this.logger.log(`perfil admin recebeu ${faltando.length} permissão(ões) nova(s) do catálogo`);
    } catch (e) {
      this.logger.warn(`não foi possível conferir o perfil admin: ${(e as Error).message}`);
    }
  }

  /* --------------------------------- catálogo -------------------------------- */

  catalogo() {
    return { grupos: CATALOGO_PERMISSOES };
  }

  /* ---------------------------------- perfis --------------------------------- */

  async listarPerfis() {
    const perfis = await this.prisma.perfilAcesso.findMany({
      orderBy: [{ sistema: 'desc' }, { nome: 'asc' }],
      select: { ...CAMPOS_PERFIL, _count: { select: { usuarios: true } } },
    });
    return perfis.map(({ _count, ...p }) => ({ ...p, usuarios: _count.usuarios }));
  }

  async criarPerfil(dto: CriarPerfilDto) {
    const permissoes = this.validarPermissoes(dto.permissoes);
    const slug = await this.slugLivre(dto.nome);
    return this.prisma.perfilAcesso.create({
      data: {
        slug,
        nome: dto.nome,
        descricao: dto.descricao ?? null,
        sistema: false,
        permissoes,
      },
      select: CAMPOS_PERFIL,
    });
  }

  async atualizarPerfil(id: string, dto: AtualizarPerfilDto) {
    const perfil = await this.exigirPerfil(id);
    if (perfil.sistema) {
      throw new ConflictException({
        codigo: 'PERFIL_DE_SISTEMA',
        message: `O perfil "${perfil.nome}" é de sistema e não pode ser alterado.`,
      });
    }
    return this.prisma.perfilAcesso.update({
      where: { id },
      data: {
        ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
        ...(dto.descricao !== undefined ? { descricao: dto.descricao || null } : {}),
        ...(dto.permissoes !== undefined
          ? { permissoes: this.validarPermissoes(dto.permissoes) }
          : {}),
      },
      select: CAMPOS_PERFIL,
    });
  }

  async excluirPerfil(id: string) {
    const perfil = await this.exigirPerfil(id);
    if (perfil.sistema) {
      throw new ConflictException({
        codigo: 'PERFIL_DE_SISTEMA',
        message: `O perfil "${perfil.nome}" é de sistema e não pode ser excluído.`,
      });
    }
    // A FK é ON DELETE SET NULL: apagar funcionaria, e as pessoas cairiam no
    // fallback por setor sem ninguém perceber. Melhor recusar e obrigar a
    // mover cada uma para outro perfil, de forma consciente.
    const emUso = await this.prisma.usuario.count({ where: { perfilAcessoId: id } });
    if (emUso > 0) {
      throw new ConflictException({
        codigo: 'PERFIL_EM_USO',
        message: `${emUso} usuário(s) ainda usam este perfil. Mova-os para outro antes de excluir.`,
      });
    }
    await this.prisma.perfilAcesso.delete({ where: { id } });
    return { ok: true };
  }

  /* --------------------------------- usuários -------------------------------- */

  async listarUsuarios() {
    const us = await this.prisma.usuario.findMany({
      orderBy: [{ ativo: 'desc' }, { nome: 'asc' }],
      select: CAMPOS_USUARIO,
    });
    return us.map((u) => ({
      ...u,
      setores: [...new Set([u.setor, ...u.setores.map((s) => s.setor)])].filter(Boolean),
    }));
  }

  /**
   * Cria a conta com senha TEMPORÁRIA gerada aqui e devolvida uma única vez
   * na resposta — mesma escolha do seed (prisma/seed.ts): nada de senha
   * padrão igual para todos, que vaza no primeiro print e continua valendo
   * meses depois. A pessoa é obrigada a trocar no primeiro login.
   */
  async criarUsuario(dto: CriarUsuarioDto, autor: UsuarioLogado) {
    const email = dto.email.toLowerCase();
    const jaExiste = await this.prisma.usuario.findUnique({ where: { email }, select: { id: true } });
    if (jaExiste) {
      throw new ConflictException({
        codigo: 'EMAIL_EM_USO',
        message: 'Já existe uma conta com este e-mail.',
      });
    }

    const perfilId = dto.perfilAcessoId ?? (await this.idDoPerfilPadrao());
    if (dto.perfilAcessoId) await this.exigirPerfil(dto.perfilAcessoId);

    const senha = randomBytes(12).toString('base64url');
    const usuario = await this.prisma.usuario.create({
      data: {
        email,
        nome: dto.nome,
        senhaHash: await AuthService.hashSenha(senha),
        papel: dto.papel,
        setor: dto.setor,
        perfilAcessoId: perfilId,
        precisaTrocarSenha: true,
        setores: {
          createMany: {
            data: this.setoresExtras(dto.setoresExtras, dto.setor).map((setor) => ({ setor })),
            skipDuplicates: true,
          },
        },
      },
      select: CAMPOS_USUARIO,
    });

    await this.notificacoes.notificar([usuario.id], {
      titulo: 'Bem-vindo ao FebraHub',
      mensagem: `Sua conta foi criada por ${autor.nome}. Troque a senha temporária no primeiro acesso.`,
      tipo: 'sucesso',
      categoria: 'acesso',
      autorId: autor.id,
    });

    return {
      usuario: {
        ...usuario,
        setores: [...new Set([usuario.setor, ...usuario.setores.map((s) => s.setor)])],
      },
      // Some da API depois desta resposta: o banco só guarda o hash argon2id.
      senhaTemporaria: senha,
    };
  }

  async atualizarUsuario(id: string, dto: AtualizarUsuarioDto, autor: UsuarioLogado) {
    const atual = await this.prisma.usuario.findUnique({
      where: { id },
      select: { ...CAMPOS_USUARIO, papel: true },
    });
    if (!atual) throw new NotFoundException('Usuário não encontrado.');

    // A trava contra se trancar para fora: quem está editando não pode se
    // desativar nem se rebaixar de admin. Um clique distraído aqui só se
    // desfaz com acesso ao banco.
    if (id === autor.id) {
      if (dto.ativo === false) {
        throw new BadRequestException({
          codigo: 'AUTO_DESATIVACAO',
          message: 'Você não pode desativar a própria conta.',
        });
      }
      if (dto.papel && dto.papel !== 'admin' && atual.papel === 'admin') {
        throw new BadRequestException({
          codigo: 'AUTO_REBAIXAMENTO',
          message: 'Você não pode remover o próprio papel de administrador.',
        });
      }
    }

    if (dto.perfilAcessoId) await this.exigirPerfil(dto.perfilAcessoId);

    const setorNovo = dto.setor ?? atual.setor;
    const usuario = await this.prisma.$transaction(async (tx) => {
      if (dto.setoresExtras !== undefined || dto.setor !== undefined) {
        // Substituição, não acréscimo: a tela manda a lista inteira, e tirar
        // acesso precisa funcionar tão bem quanto dar.
        await tx.perfilSetor.deleteMany({ where: { usuarioId: id } });
        const extras = this.setoresExtras(
          dto.setoresExtras ?? atual.setores.map((s) => s.setor),
          setorNovo,
        );
        if (extras.length) {
          await tx.perfilSetor.createMany({
            data: extras.map((setor) => ({ usuarioId: id, setor })),
            skipDuplicates: true,
          });
        }
      }

      return tx.usuario.update({
        where: { id },
        data: {
          ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
          ...(dto.papel !== undefined ? { papel: dto.papel } : {}),
          ...(dto.setor !== undefined ? { setor: dto.setor } : {}),
          ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
          ...(dto.perfilAcessoId !== undefined ? { perfilAcessoId: dto.perfilAcessoId } : {}),
        },
        select: CAMPOS_USUARIO,
      });
    });

    // Desativar sem derrubar a sessão deixaria a pessoa navegando até o
    // token vencer. O login já recusa conta inativa; falta cortar o que está
    // em voo.
    if (dto.ativo === false) await this.auth.revogarTodas(id);

    const mudouPerfil =
      dto.perfilAcessoId !== undefined && dto.perfilAcessoId !== atual.perfilAcessoId;
    if (mudouPerfil && id !== autor.id) {
      await this.notificacoes.notificar([id], {
        titulo: 'Seu acesso mudou',
        mensagem: usuario.perfilAcesso
          ? `${autor.nome} mudou seu perfil de acesso para "${usuario.perfilAcesso.nome}". Recarregue a página para ver o menu atualizado.`
          : `${autor.nome} removeu seu perfil de acesso. Você passa a ver apenas o seu setor.`,
        tipo: 'alerta',
        categoria: 'acesso',
        autorId: autor.id,
      });
    }

    return {
      ...usuario,
      setores: [...new Set([usuario.setor, ...usuario.setores.map((s) => s.setor)])].filter(Boolean),
    };
  }

  /** Gera outra senha temporária — o caminho de "esqueci a senha" sem e-mail
   *  transacional configurado. Derruba as sessões da pessoa. */
  async redefinirSenha(id: string) {
    const u = await this.prisma.usuario.findUnique({ where: { id }, select: { id: true } });
    if (!u) throw new NotFoundException('Usuário não encontrado.');
    const senha = randomBytes(12).toString('base64url');
    await this.prisma.usuario.update({
      where: { id },
      data: { senhaHash: await AuthService.hashSenha(senha), precisaTrocarSenha: true },
    });
    await this.auth.revogarTodas(id);
    return { senhaTemporaria: senha };
  }

  /* --------------------------------- privados -------------------------------- */

  private validarPermissoes(ids: readonly string[]): string[] {
    const desconhecidas = permissoesDesconhecidas(ids);
    if (desconhecidas.length) {
      throw new BadRequestException({
        codigo: 'PERMISSAO_DESCONHECIDA',
        message: `Permissão inexistente: ${desconhecidas.join(', ')}`,
      });
    }
    return normalizarPermissoes(ids);
  }

  private async exigirPerfil(id: string) {
    const p = await this.prisma.perfilAcesso.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Perfil de acesso não encontrado.');
    return p;
  }

  private async idDoPerfilPadrao(): Promise<string | null> {
    const p = await this.prisma.perfilAcesso.findUnique({
      where: { slug: PERFIL_PADRAO_NOVO_USUARIO },
      select: { id: true },
    });
    return p?.id ?? null;
  }

  /** O setor primário nunca vira linha em usuario_setores: ele já vale por
   *  si só em podeVer(), e duplicá-lo só criaria duas verdades. */
  private setoresExtras(lista: readonly string[] | undefined, primario: string): string[] {
    return [...new Set(lista ?? [])].filter((s) => s && s !== primario);
  }

  private async slugLivre(nome: string): Promise<string> {
    const base =
      nome
        .normalize('NFD')
        // Tira os acentos que a decomposição separou: "Pedagógico" -> "pedagogico".
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'perfil';
    for (let i = 0; i < 50; i++) {
      const tentativa = i === 0 ? base : `${base}-${i + 1}`;
      const existe = await this.prisma.perfilAcesso.count({ where: { slug: tentativa } });
      if (!existe) return tentativa;
    }
    return `${base}-${randomBytes(3).toString('hex')}`;
  }
}
