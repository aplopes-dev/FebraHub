/**
 * CRM — núcleo (clientes, funil, negócios, tarefas), tenant único.
 *
 * Regras herdadas do sistema de origem que valem aqui:
 *   - "Lead" não é tabela: é crm_clientes com estagio='lead'.
 *   - Mover negócio para etapa 'ganha'/'perdida' FECHA o negócio
 *     (fechado_em) e registra atividade tipo 'estagio'; perder exige motivo.
 *   - Toda escrita relevante deixa trilha em auditoria_acesso.
 * Dinheiro em centavos (inteiro) — o front formata.
 */
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { UsuarioLogado } from '../../common/decorators/usuario.decorator';

const numero = (v: bigint | null | undefined): number => Number(v ?? 0);

@Injectable()
export class CrmService {
  constructor(private readonly prisma: PrismaService) {}

  private auditar(u: UsuarioLogado, acao: string, recurso: string, detalhe?: object, ip?: string) {
    return this.prisma.auditoriaAcesso
      .create({ data: { usuarioId: u.id, acao, recurso, detalhe: detalhe as never, ip } })
      .catch(() => undefined);
  }

  /** Mapa id→nome dos usuários ativos — para exibir responsável/autor. */
  async usuarios() {
    const linhas = await this.prisma.usuario.findMany({
      where: { ativo: true },
      select: { id: true, nome: true, setor: true },
      orderBy: { nome: 'asc' },
    });
    return linhas;
  }

  /* ------------------------------ resumo ------------------------------ */

  async resumo() {
    const hoje = new Date();
    const [porEstagio, funis, tarefasAbertas, tarefasAtrasadas, abertosPorEtapa] =
      await Promise.all([
        this.prisma.crmCliente.groupBy({ by: ['estagio'], _count: true }),
        this.prisma.crmFunil.findMany({
          where: { status: 'ativo' },
          include: { etapas: { orderBy: { ordem: 'asc' } } },
        }),
        this.prisma.crmTarefa.count({ where: { concluidaEm: null } }),
        this.prisma.crmTarefa.count({
          where: { concluidaEm: null, venceEm: { lt: hoje } },
        }),
        this.prisma.crmNegocio.groupBy({
          by: ['etapaId'],
          where: { fechadoEm: null },
          _count: true,
          _sum: { valorCentavos: true },
        }),
      ]);
    const ganhosMes = await this.prisma.crmNegocio.aggregate({
      where: {
        fechadoEm: { gte: new Date(hoje.getFullYear(), hoje.getMonth(), 1) },
        etapa: { tipo: 'ganha' },
      },
      _count: true,
      _sum: { valorCentavos: true },
    });
    return {
      clientesPorEstagio: porEstagio.map((g) => ({ estagio: g.estagio, total: g._count })),
      funis: funis.map((f) => ({
        id: f.id,
        nome: f.nome,
        etapas: f.etapas.map((e) => {
          const doGrupo = abertosPorEtapa.find((g) => g.etapaId === e.id);
          return {
            id: e.id,
            nome: e.nome,
            cor: e.cor,
            tipo: e.tipo,
            probabilidade: e.probabilidade,
            ordem: e.ordem,
            abertos: doGrupo?._count ?? 0,
            valorCentavos: numero(doGrupo?._sum.valorCentavos),
          };
        }),
      })),
      tarefasAbertas,
      tarefasAtrasadas,
      ganhosNoMes: { total: ganhosMes._count, valorCentavos: numero(ganhosMes._sum.valorCentavos) },
    };
  }

  /* ----------------------------- clientes ----------------------------- */

  async listarClientes(args: {
    estagio?: string;
    busca?: string;
    pagina: number;
    porPagina: number;
  }) {
    const where: Prisma.CrmClienteWhereInput = {
      ...(args.estagio ? { estagio: args.estagio } : {}),
      ...(args.busca
        ? {
            OR: [
              { nome: { contains: args.busca, mode: 'insensitive' } },
              { email: { contains: args.busca, mode: 'insensitive' } },
              { documento: { contains: args.busca } },
              { telefone: { contains: args.busca } },
            ],
          }
        : {}),
    };
    const [total, itens] = await this.prisma.$transaction([
      this.prisma.crmCliente.count({ where }),
      this.prisma.crmCliente.findMany({
        where,
        include: { _count: { select: { negocios: true, contatos: true, tarefas: { where: { concluidaEm: null } } } } },
        orderBy: [{ atualizadoEm: 'desc' }],
        skip: (args.pagina - 1) * args.porPagina,
        take: args.porPagina,
      }),
    ]);
    return {
      itens: itens.map((c) => ({
        ...c,
        negocios: c._count.negocios,
        contatos: c._count.contatos,
        tarefasAbertas: c._count.tarefas,
        _count: undefined,
      })),
      total,
      pagina: args.pagina,
      porPagina: args.porPagina,
    };
  }

  async criarCliente(u: UsuarioLogado, dado: Prisma.CrmClienteUncheckedCreateInput, ip?: string) {
    const cliente = await this.prisma.crmCliente.create({
      data: { ...dado, criadoPor: u.id, responsavelId: dado.responsavelId ?? u.id },
    });
    await this.auditar(u, 'crm_cliente_criado', `crm/clientes/${cliente.id}`, { nome: cliente.nome }, ip);
    return cliente;
  }

  async detalheCliente(id: string) {
    const cliente = await this.prisma.crmCliente.findUnique({
      where: { id },
      include: {
        contatos: { orderBy: [{ principal: 'desc' }, { nome: 'asc' }] },
        atividades: { orderBy: { criadoEm: 'desc' }, take: 60 },
        negocios: {
          include: { etapa: { select: { nome: true, cor: true, tipo: true } } },
          orderBy: { atualizadoEm: 'desc' },
        },
        tarefas: { orderBy: [{ concluidaEm: 'asc' }, { venceEm: 'asc' }], take: 40 },
      },
    });
    if (!cliente) throw new NotFoundException({ codigo: 'CLIENTE_DESCONHECIDO', message: 'Cliente não encontrado' });
    return {
      ...cliente,
      negocios: cliente.negocios.map((n) => ({ ...n, valorCentavos: numero(n.valorCentavos) })),
    };
  }

  async atualizarCliente(u: UsuarioLogado, id: string, dado: Prisma.CrmClienteUncheckedUpdateInput, ip?: string) {
    const anterior = await this.prisma.crmCliente.findUnique({ where: { id } });
    if (!anterior) throw new NotFoundException({ codigo: 'CLIENTE_DESCONHECIDO', message: 'Cliente não encontrado' });
    const cliente = await this.prisma.crmCliente.update({
      where: { id },
      data: { ...dado, atualizadoEm: new Date() },
    });
    await this.auditar(u, 'crm_cliente_atualizado', `crm/clientes/${id}`, { de: { estagio: anterior.estagio }, para: { estagio: cliente.estagio } }, ip);
    return cliente;
  }

  async removerCliente(u: UsuarioLogado, id: string, ip?: string) {
    const negocios = await this.prisma.crmNegocio.count({ where: { clienteId: id } });
    if (negocios > 0) {
      throw new BadRequestException({
        codigo: 'CLIENTE_COM_NEGOCIOS',
        message: 'Cliente tem negócios vinculados — remova-os antes',
      });
    }
    await this.prisma.crmCliente.delete({ where: { id } });
    await this.auditar(u, 'crm_cliente_removido', `crm/clientes/${id}`, undefined, ip);
  }

  criarContato(u: UsuarioLogado, clienteId: string, dado: { nome: string; cargo?: string; email?: string; telefone?: string; principal?: boolean }) {
    return this.prisma.crmClienteContato.create({ data: { ...dado, clienteId } });
  }

  async removerContato(clienteId: string, contatoId: string) {
    await this.prisma.crmClienteContato.deleteMany({ where: { id: contatoId, clienteId } });
  }

  async criarAtividadeCliente(u: UsuarioLogado, clienteId: string, texto: string) {
    const atividade = await this.prisma.crmClienteAtividade.create({
      data: { clienteId, texto, autorId: u.id },
    });
    await this.prisma.crmCliente.update({ where: { id: clienteId }, data: { atualizadoEm: new Date() } });
    return atividade;
  }

  /* ------------------------------- funil ------------------------------- */

  funis() {
    return this.prisma.crmFunil.findMany({
      where: { status: 'ativo' },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
      orderBy: { criadoEm: 'asc' },
    });
  }

  /* -------- CRUD de funis e etapas (configuração do pipeline) -------- */

  async criarFunil(u: UsuarioLogado, dado: { nome: string; cor?: string }, ip?: string) {
    const funil = await this.prisma.crmFunil.create({
      data: {
        nome: dado.nome, cor: dado.cor ?? null,
        // Todo funil nasce com um esqueleto útil de etapas.
        etapas: { create: [
          { nome: 'Novo', cor: '#3976a8', ordem: 0, tipo: 'aberta', probabilidade: 10 },
          { nome: 'Em andamento', cor: '#8A6410', ordem: 1, tipo: 'aberta', probabilidade: 50 },
          { nome: 'Ganho', cor: '#2E7D32', ordem: 2, tipo: 'ganha', probabilidade: 100, sistema: true },
          { nome: 'Perdido', cor: '#C0392B', ordem: 3, tipo: 'perdida', probabilidade: 0, sistema: true },
        ] },
      },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
    });
    await this.auditar(u, 'crm_funil_criado', `crm/funis/${funil.id}`, { nome: dado.nome }, ip);
    return funil;
  }

  async atualizarFunil(u: UsuarioLogado, id: string, dado: { nome?: string; cor?: string }, ip?: string) {
    const funil = await this.prisma.crmFunil.update({
      where: { id },
      data: { ...(dado.nome !== undefined ? { nome: dado.nome } : {}), ...(dado.cor !== undefined ? { cor: dado.cor } : {}) },
    });
    await this.auditar(u, 'crm_funil_atualizado', `crm/funis/${id}`, { ...dado }, ip);
    return funil;
  }

  async removerFunil(u: UsuarioLogado, id: string, ip?: string) {
    const emUso = await this.prisma.crmNegocio.count({ where: { funilId: id } });
    if (emUso) throw new ConflictException(`Este funil tem ${emUso} negócio(s). Mova-os antes de arquivar.`);
    const ativos = await this.prisma.crmFunil.count({ where: { status: 'ativo' } });
    if (ativos <= 1) throw new ConflictException('Não é possível arquivar o único funil ativo.');
    await this.prisma.crmFunil.update({ where: { id }, data: { status: 'arquivado' } });
    await this.auditar(u, 'crm_funil_arquivado', `crm/funis/${id}`, {}, ip);
  }

  async criarEtapa(u: UsuarioLogado, funilId: string, dado: { nome: string; cor?: string; probabilidade?: number }, ip?: string) {
    const max = await this.prisma.crmEtapa.aggregate({ where: { funilId }, _max: { ordem: true } });
    // Insere antes das etapas de sistema (ganha/perdida ficam no fim).
    const etapa = await this.prisma.crmEtapa.create({
      data: { funilId, nome: dado.nome, cor: dado.cor ?? '#3976a8', probabilidade: dado.probabilidade ?? 0, tipo: 'aberta', ordem: (max._max.ordem ?? 0) + 1 },
    });
    await this.auditar(u, 'crm_etapa_criada', `crm/etapas/${etapa.id}`, { nome: dado.nome, funilId }, ip);
    return etapa;
  }

  async atualizarEtapa(u: UsuarioLogado, id: string, dado: { nome?: string; cor?: string; probabilidade?: number; ordem?: number }, ip?: string) {
    const etapa = await this.prisma.crmEtapa.update({
      where: { id },
      data: {
        ...(dado.nome !== undefined ? { nome: dado.nome } : {}),
        ...(dado.cor !== undefined ? { cor: dado.cor } : {}),
        ...(dado.probabilidade !== undefined ? { probabilidade: dado.probabilidade } : {}),
        ...(dado.ordem !== undefined ? { ordem: dado.ordem } : {}),
      },
    });
    await this.auditar(u, 'crm_etapa_atualizada', `crm/etapas/${id}`, { ...dado }, ip);
    return etapa;
  }

  async removerEtapa(u: UsuarioLogado, id: string, ip?: string) {
    const etapa = await this.prisma.crmEtapa.findUnique({ where: { id } });
    if (!etapa) throw new NotFoundException('Etapa não encontrada.');
    if (etapa.sistema) throw new ConflictException('As etapas de ganho e perda não podem ser removidas.');
    const emUso = await this.prisma.crmNegocio.count({ where: { etapaId: id } });
    if (emUso) throw new ConflictException(`Esta etapa tem ${emUso} negócio(s). Mova-os antes de remover.`);
    await this.prisma.crmEtapa.delete({ where: { id } });
    await this.auditar(u, 'crm_etapa_removida', `crm/etapas/${id}`, { nome: etapa.nome }, ip);
  }

  /* ------------------------------ negócios ----------------------------- */

  async listarNegocios(args: { funilId?: string; clienteId?: string; abertos?: boolean }) {
    const negocios = await this.prisma.crmNegocio.findMany({
      where: {
        ...(args.funilId ? { funilId: args.funilId } : {}),
        ...(args.clienteId ? { clienteId: args.clienteId } : {}),
        ...(args.abertos ? { fechadoEm: null } : {}),
      },
      include: {
        cliente: { select: { id: true, nome: true, estagio: true } },
        etapa: { select: { id: true, nome: true, cor: true, tipo: true, ordem: true } },
        _count: { select: { tarefas: { where: { concluidaEm: null } } } },
      },
      orderBy: [{ atualizadoEm: 'desc' }],
      take: 500,
    });
    return negocios.map((n) => ({
      ...n,
      valorCentavos: numero(n.valorCentavos),
      tarefasAbertas: n._count.tarefas,
      _count: undefined,
    }));
  }

  async criarNegocio(
    u: UsuarioLogado,
    dado: { titulo: string; clienteId: string; funilId?: string; etapaId?: string; valorCentavos?: number; contatoId?: string; responsavelId?: string },
    ip?: string,
  ) {
    const funil = dado.funilId
      ? await this.prisma.crmFunil.findUnique({ where: { id: dado.funilId }, include: { etapas: { orderBy: { ordem: 'asc' } } } })
      : await this.prisma.crmFunil.findFirst({ where: { status: 'ativo' }, include: { etapas: { orderBy: { ordem: 'asc' } } } });
    if (!funil) throw new BadRequestException({ codigo: 'SEM_FUNIL', message: 'Nenhum funil ativo' });
    const etapa = dado.etapaId
      ? funil.etapas.find((e) => e.id === dado.etapaId)
      : funil.etapas.find((e) => e.tipo === 'aberta');
    if (!etapa) throw new BadRequestException({ codigo: 'ETAPA_INVALIDA', message: 'Etapa fora do funil' });

    const negocio = await this.prisma.crmNegocio.create({
      data: {
        titulo: dado.titulo,
        clienteId: dado.clienteId,
        contatoId: dado.contatoId ?? null,
        funilId: funil.id,
        etapaId: etapa.id,
        valorCentavos: BigInt(Math.round(dado.valorCentavos ?? 0)),
        responsavelId: dado.responsavelId ?? u.id,
        criadoPor: u.id,
        ultimaAtividadeEm: new Date(),
        atividades: { create: { tipo: 'criado', texto: `Negócio criado na etapa ${etapa.nome}.`, autorId: u.id } },
      },
    });
    // Cliente em 'lead' com negócio aberto vira oportunidade — regra da origem.
    await this.prisma.crmCliente.updateMany({
      where: { id: dado.clienteId, estagio: 'lead' },
      data: { estagio: 'oportunidade', atualizadoEm: new Date() },
    });
    await this.auditar(u, 'crm_negocio_criado', `crm/negocios/${negocio.id}`, { titulo: dado.titulo }, ip);
    return { ...negocio, valorCentavos: numero(negocio.valorCentavos) };
  }

  async detalheNegocio(id: string) {
    const negocio = await this.prisma.crmNegocio.findUnique({
      where: { id },
      include: {
        cliente: { select: { id: true, nome: true, estagio: true, telefone: true, email: true } },
        contato: true,
        etapa: true,
        funil: { include: { etapas: { orderBy: { ordem: 'asc' } } } },
        atividades: { orderBy: { criadoEm: 'desc' }, take: 80 },
        tarefas: { orderBy: [{ concluidaEm: 'asc' }, { venceEm: 'asc' }] },
      },
    });
    if (!negocio) throw new NotFoundException({ codigo: 'NEGOCIO_DESCONHECIDO', message: 'Negócio não encontrado' });
    return { ...negocio, valorCentavos: numero(negocio.valorCentavos) };
  }

  async atualizarNegocio(
    u: UsuarioLogado,
    id: string,
    dado: { titulo?: string; valorCentavos?: number; responsavelId?: string | null; contatoId?: string | null },
    ip?: string,
  ) {
    const negocio = await this.prisma.crmNegocio.update({
      where: { id },
      data: {
        ...(dado.titulo !== undefined ? { titulo: dado.titulo } : {}),
        ...(dado.valorCentavos !== undefined ? { valorCentavos: BigInt(Math.round(dado.valorCentavos)) } : {}),
        ...(dado.responsavelId !== undefined ? { responsavelId: dado.responsavelId } : {}),
        ...(dado.contatoId !== undefined ? { contatoId: dado.contatoId } : {}),
        atualizadoEm: new Date(),
      },
    });
    await this.auditar(u, 'crm_negocio_atualizado', `crm/negocios/${id}`, undefined, ip);
    return { ...negocio, valorCentavos: numero(negocio.valorCentavos) };
  }

  async moverNegocio(u: UsuarioLogado, id: string, etapaId: string, motivoPerda: string | undefined, ip?: string) {
    const negocio = await this.prisma.crmNegocio.findUnique({ where: { id }, include: { etapa: true } });
    if (!negocio) throw new NotFoundException({ codigo: 'NEGOCIO_DESCONHECIDO', message: 'Negócio não encontrado' });
    const etapa = await this.prisma.crmEtapa.findFirst({ where: { id: etapaId, funilId: negocio.funilId } });
    if (!etapa) throw new BadRequestException({ codigo: 'ETAPA_INVALIDA', message: 'Etapa fora do funil deste negócio' });
    if (etapa.tipo === 'perdida' && !motivoPerda?.trim()) {
      throw new BadRequestException({ codigo: 'MOTIVO_OBRIGATORIO', message: 'Perder um negócio exige o motivo' });
    }

    const fechado = etapa.tipo !== 'aberta';
    const atualizado = await this.prisma.crmNegocio.update({
      where: { id },
      data: {
        etapaId,
        fechadoEm: fechado ? new Date() : null,
        motivoPerda: etapa.tipo === 'perdida' ? motivoPerda!.trim() : null,
        ultimaAtividadeEm: new Date(),
        atualizadoEm: new Date(),
        atividades: {
          create: {
            tipo: 'estagio',
            texto:
              `${negocio.etapa.nome} → ${etapa.nome}` +
              (etapa.tipo === 'perdida' ? ` — motivo: ${motivoPerda!.trim()}` : ''),
            autorId: u.id,
          },
        },
      },
    });
    if (etapa.tipo === 'ganha') {
      await this.prisma.crmCliente.update({
        where: { id: negocio.clienteId },
        data: { estagio: 'cliente_ativo', atualizadoEm: new Date() },
      });
    }
    await this.auditar(u, 'crm_negocio_movido', `crm/negocios/${id}`, { de: negocio.etapa.nome, para: etapa.nome }, ip);
    return { ...atualizado, valorCentavos: numero(atualizado.valorCentavos) };
  }

  async removerNegocio(u: UsuarioLogado, id: string, ip?: string) {
    await this.prisma.crmNegocio.delete({ where: { id } });
    await this.auditar(u, 'crm_negocio_removido', `crm/negocios/${id}`, undefined, ip);
  }

  async criarAtividadeNegocio(u: UsuarioLogado, negocioId: string, tipo: string, texto: string) {
    const atividade = await this.prisma.crmNegocioAtividade.create({
      data: { negocioId, tipo, texto, autorId: u.id },
    });
    await this.prisma.crmNegocio.update({
      where: { id: negocioId },
      data: { ultimaAtividadeEm: new Date(), atualizadoEm: new Date() },
    });
    return atividade;
  }

  /* ------------------------------ tarefas ------------------------------ */

  async listarTarefas(args: { abertas?: boolean; responsavelId?: string }) {
    const tarefas = await this.prisma.crmTarefa.findMany({
      where: {
        ...(args.abertas === true ? { concluidaEm: null } : {}),
        ...(args.abertas === false ? { concluidaEm: { not: null } } : {}),
        ...(args.responsavelId ? { responsavelId: args.responsavelId } : {}),
      },
      include: {
        negocio: { select: { id: true, titulo: true } },
        cliente: { select: { id: true, nome: true } },
      },
      orderBy: [{ concluidaEm: 'asc' }, { venceEm: 'asc' }, { criadoEm: 'desc' }],
      take: 300,
    });
    return tarefas;
  }

  async criarTarefa(
    u: UsuarioLogado,
    dado: { titulo: string; tipo?: string; prioridade?: string; venceEm?: string; negocioId?: string; clienteId?: string; responsavelId?: string },
    ip?: string,
  ) {
    const tarefa = await this.prisma.crmTarefa.create({
      data: {
        titulo: dado.titulo,
        tipo: dado.tipo ?? 'follow_up',
        prioridade: dado.prioridade ?? 'media',
        venceEm: dado.venceEm ? new Date(dado.venceEm) : null,
        negocioId: dado.negocioId ?? null,
        clienteId: dado.clienteId ?? null,
        responsavelId: dado.responsavelId ?? u.id,
        criadoPor: u.id,
      },
    });
    if (dado.negocioId) {
      await this.criarAtividadeNegocio(u, dado.negocioId, 'tarefa', `Tarefa criada: ${dado.titulo}`);
    }
    await this.auditar(u, 'crm_tarefa_criada', `crm/tarefas/${tarefa.id}`, { titulo: dado.titulo }, ip);
    return tarefa;
  }

  async concluirTarefa(u: UsuarioLogado, id: string, resultado?: string) {
    const tarefa = await this.prisma.crmTarefa.update({
      where: { id },
      data: { concluidaEm: new Date(), resultado: resultado ?? null },
    });
    if (tarefa.negocioId) {
      await this.criarAtividadeNegocio(u, tarefa.negocioId, 'tarefa', `Tarefa concluída: ${tarefa.titulo}${resultado ? ` — ${resultado}` : ''}`);
    }
    return tarefa;
  }

  reabrirTarefa(id: string) {
    return this.prisma.crmTarefa.update({ where: { id }, data: { concluidaEm: null, resultado: null } });
  }

  async atualizarTarefa(
    u: UsuarioLogado,
    id: string,
    dado: { titulo?: string; tipo?: string; prioridade?: string; venceEm?: string; responsavelId?: string },
    ip?: string,
  ) {
    const tarefa = await this.prisma.crmTarefa.update({
      where: { id },
      data: {
        ...(dado.titulo !== undefined ? { titulo: dado.titulo } : {}),
        ...(dado.tipo !== undefined ? { tipo: dado.tipo } : {}),
        ...(dado.prioridade !== undefined ? { prioridade: dado.prioridade } : {}),
        ...(dado.venceEm !== undefined ? { venceEm: dado.venceEm ? new Date(dado.venceEm) : null } : {}),
        ...(dado.responsavelId !== undefined ? { responsavelId: dado.responsavelId } : {}),
      },
    });
    await this.auditar(u, 'crm_tarefa_atualizada', `crm/tarefas/${id}`, { ...dado }, ip);
    return tarefa;
  }

  async removerTarefa(u: UsuarioLogado, id: string, ip?: string) {
    const tarefa = await this.prisma.crmTarefa.findUnique({ where: { id } });
    if (!tarefa) throw new NotFoundException('Tarefa não encontrada.');
    await this.prisma.crmTarefa.delete({ where: { id } });
    await this.auditar(u, 'crm_tarefa_removida', `crm/tarefas/${id}`, { titulo: tarefa.titulo }, ip);
  }
}
