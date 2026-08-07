import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import type { UsuarioLogado } from '../../common/decorators/usuario.decorator';
import { EnviarNotificacaoDto, TipoNotificacao } from './notificacoes.dto';

/** Quantas o sino carrega de uma vez. Passar disso vira rolagem infinita para
 *  ler aviso antigo — que ninguém faz. */
const LIMITE_PADRAO = 20;

export interface NovaNotificacao {
  titulo: string;
  mensagem: string;
  tipo?: TipoNotificacao;
  categoria?: string;
  href?: string | null;
  /** Nulo = o próprio sistema disparou. */
  autorId?: string | null;
}

/**
 * Notificações do hub.
 *
 * Uma linha POR DESTINATÁRIO, inclusive no envio para todos: leitura e
 * exclusão são respostas individuais, e o modelo "um envio + uma tabela de
 * leituras" cobraria um join em cada abertura do sino — a consulta mais
 * repetida do app, feita por toda aba a cada minuto.
 *
 * Fora da tela de comunicados, quem chama `notificar()` é o resto da API:
 * hoje a troca de perfil de acesso avisa a pessoa afetada.
 */
@Injectable()
export class NotificacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(usuarioId: string, opcoes: { apenasNaoLidas?: boolean; limite?: number } = {}) {
    const where = {
      usuarioId,
      ...(opcoes.apenasNaoLidas ? { lidaEm: null } : {}),
    };
    const [itens, naoLidas] = await Promise.all([
      this.prisma.notificacao.findMany({
        where,
        orderBy: { criadaEm: 'desc' },
        take: opcoes.limite ?? LIMITE_PADRAO,
        select: {
          id: true,
          titulo: true,
          mensagem: true,
          tipo: true,
          categoria: true,
          href: true,
          lidaEm: true,
          criadaEm: true,
        },
      }),
      // Sempre o total real de não-lidas, mesmo quando a lista veio cortada:
      // o número do sino não pode depender do tamanho da página.
      this.prisma.notificacao.count({ where: { usuarioId, lidaEm: null } }),
    ]);
    return { itens, naoLidas };
  }

  /** Idempotente: reabrir a mesma notificação não reescreve a data da leitura. */
  async marcarLida(usuarioId: string, id: string): Promise<void> {
    const { count } = await this.prisma.notificacao.updateMany({
      // O usuarioId no WHERE é a autorização: sem ele, qualquer id de outra
      // pessoa seria aceito.
      where: { id, usuarioId, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    if (count === 0) {
      const existe = await this.prisma.notificacao.count({ where: { id, usuarioId } });
      if (!existe) throw new NotFoundException('Notificação não encontrada.');
    }
  }

  async marcarTodasLidas(usuarioId: string): Promise<{ atualizadas: number }> {
    const { count } = await this.prisma.notificacao.updateMany({
      where: { usuarioId, lidaEm: null },
      data: { lidaEm: new Date() },
    });
    return { atualizadas: count };
  }

  async excluir(usuarioId: string, id: string): Promise<void> {
    const { count } = await this.prisma.notificacao.deleteMany({ where: { id, usuarioId } });
    if (count === 0) throw new NotFoundException('Notificação não encontrada.');
  }

  /** Cria uma notificação para cada destinatário. Chamada interna. */
  async notificar(destinatarios: readonly string[], dados: NovaNotificacao): Promise<number> {
    const ids = [...new Set(destinatarios)].filter(Boolean);
    if (!ids.length) return 0;
    const { count } = await this.prisma.notificacao.createMany({
      data: ids.map((usuarioId) => ({
        usuarioId,
        titulo: dados.titulo,
        mensagem: dados.mensagem,
        tipo: dados.tipo ?? 'info',
        categoria: dados.categoria ?? null,
        href: dados.href ?? null,
        criadaPor: dados.autorId ?? null,
      })),
    });
    return count;
  }

  /** Envio em lote pela tela de comunicados (permissão `notificacoes.enviar`). */
  async enviar(autor: UsuarioLogado, dto: EnviarNotificacaoDto) {
    const destinatarios = await this.resolverDestinatarios(dto);
    if (!destinatarios.length) {
      throw new BadRequestException({
        codigo: 'SEM_DESTINATARIO',
        message: 'Nenhum usuário ativo corresponde a este destino.',
      });
    }
    const enviadas = await this.notificar(destinatarios, {
      titulo: dto.titulo,
      mensagem: dto.mensagem,
      tipo: dto.tipo ?? 'info',
      categoria: 'comunicado',
      href: dto.href ?? null,
      autorId: autor.id,
    });
    return { enviadas };
  }

  /**
   * O que preencher nos seletores de destino. Existe em vez de a tela pedir
   * `GET /perfis` e `GET /usuarios`: quem só tem `notificacoes.enviar` não
   * administra acessos, e não precisa (nem deve) receber e-mail, papel e
   * último login de todo mundo para escolher um nome numa lista.
   */
  async destinos() {
    const [perfis, usuarios] = await Promise.all([
      this.prisma.perfilAcesso.findMany({
        orderBy: { nome: 'asc' },
        select: { slug: true, nome: true },
      }),
      this.prisma.usuario.findMany({
        where: { ativo: true },
        orderBy: { nome: 'asc' },
        select: { id: true, nome: true },
      }),
    ]);
    return { perfis, usuarios };
  }

  /**
   * Últimos comunicados disparados, para a tela mostrar o que já foi dito.
   * Agrupa pelo conteúdo: um envio para 12 pessoas é UMA linha no histórico.
   *
   * `destinatarios` conta as cópias que AINDA EXISTEM, não quantas saíram —
   * quem apaga o aviso da própria caixa some da conta. Registrar o número do
   * disparo exigiria uma tabela de envios; para "o que já foi comunicado",
   * que é a pergunta desta tela, a contagem viva basta (e a tela rotula
   * assim, sem prometer o que não mede).
   */
  async historico(limite = 20) {
    const linhas = await this.prisma.notificacao.groupBy({
      by: ['titulo', 'mensagem', 'tipo', 'criadaPor'],
      where: { categoria: 'comunicado' },
      _count: { _all: true },
      _max: { criadaEm: true },
      orderBy: { _max: { criadaEm: 'desc' } },
      take: limite,
    });

    const autores = await this.prisma.usuario.findMany({
      where: { id: { in: linhas.map((l) => l.criadaPor).filter((x): x is string => !!x) } },
      select: { id: true, nome: true },
    });
    const nomePor = new Map(autores.map((a) => [a.id, a.nome]));

    return linhas.map((l) => ({
      titulo: l.titulo,
      mensagem: l.mensagem,
      tipo: l.tipo,
      destinatarios: l._count._all,
      enviadaEm: l._max.criadaEm,
      autor: l.criadaPor ? (nomePor.get(l.criadaPor) ?? null) : null,
    }));
  }

  /** Só gente ATIVA recebe: notificar conta desligada é encher uma caixa que
   *  ninguém vai abrir — e o desligamento não apaga o usuário neste sistema. */
  private async resolverDestinatarios(dto: EnviarNotificacaoDto): Promise<string[]> {
    const ativos = { ativo: true } as const;

    if (dto.destino === 'todos') {
      const us = await this.prisma.usuario.findMany({ where: ativos, select: { id: true } });
      return us.map((u) => u.id);
    }

    if (!dto.valor) {
      throw new BadRequestException({
        codigo: 'DESTINO_INCOMPLETO',
        message: 'Escolha o perfil, o setor ou a pessoa que vai receber.',
      });
    }

    if (dto.destino === 'usuario') {
      const u = await this.prisma.usuario.findFirst({
        where: { id: dto.valor, ...ativos },
        select: { id: true },
      });
      return u ? [u.id] : [];
    }

    if (dto.destino === 'perfil') {
      const us = await this.prisma.usuario.findMany({
        where: { ...ativos, perfilAcesso: { slug: dto.valor } },
        select: { id: true },
      });
      return us.map((u) => u.id);
    }

    // setor: vale tanto o primário quanto os extras de usuario_setores.
    const us = await this.prisma.usuario.findMany({
      where: {
        ...ativos,
        OR: [{ setor: dto.valor }, { setores: { some: { setor: dto.valor } } }],
      },
      select: { id: true },
    });
    return us.map((u) => u.id);
  }
}
