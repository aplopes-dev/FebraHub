/**
 * Comercial — CRM de vendas (pipeline, negociações, aprovação de vendas).
 *
 * Regras obrigatórias (PRD):
 *  § 3  Pessoa Única: crm_clientes é a entidade corporativa.
 *  § 4  Deduplicação: CPF (documento) > telefone normalizado > email.
 *  § 5  Rastreabilidade de origem nunca apagada (ComLeadOrigem).
 *  §23  Valores em centavos (BigInt inteiro) — nunca Decimal.
 *  §24  Status COMERCIAL ≠ status FINANCEIRO — módulos distintos.
 *  §27  VENDA_APROVADA dispara evento corporativo para Financeiro + Pedagógico.
 *  §50  Toda venda tem auditoria completa (ComVendaHistorico).
 *  §52  Salesforce: mapeamento de IDs em ComSalesforceSync.
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
import {
  AtualizarNegociacaoDto,
  AtualizarOportunidadeDto,
  CriarLeadDto,
  CriarNegociacaoDto,
  CriarOportunidadeDto,
  CriarVendaDto,
  FiltroDashboardDto,
  FiltroKanbanDto,
  FiltroOportunidadesDto,
  FiltroVendasDto,
  MoverEtapaDto,
  RegistrarInteracaoDto,
  CriarProximaAcaoDto,
  TransferirResponsavelDto,
} from './comercial.dto';

/* ─────────────────────── helpers ─────────────────────── */

/** BigInt → number seguro para resposta JSON (JS não serializa BigInt nativo). */
const num = (v: bigint | null | undefined): number => Number(v ?? 0);

/** Normaliza telefone removendo tudo que não é dígito. */
const normalizarTelefone = (t: string): string => t.replace(/\D/g, '');

/* ─────────────────────── service ─────────────────────── */

@Injectable()
export class ComercialService {
  constructor(private readonly prisma: PrismaService) {}

  /* ─── auditoria ─── */
  private auditar(
    u: UsuarioLogado,
    acao: string,
    recurso: string,
    detalhe?: object,
    ip?: string,
  ) {
    return this.prisma.auditoriaAcesso
      .create({ data: { usuarioId: u.id, acao, recurso, detalhe: detalhe as never, ip } })
      .catch(() => undefined);
  }

  /* ──────────────────────────────────────────────────────
     FUNIL / CONFIGURAÇÃO
  ────────────────────────────────────────────────────── */

  funis() {
    return this.prisma.comFunil.findMany({
      where: { ativo: true },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
      orderBy: [{ ordem: 'asc' }, { criadoEm: 'asc' }],
      take: 100, // teto de segurança (config-like, poucos funis)
    });
  }

  motivos() {
    return this.prisma.comMotivoPerdaOp.findMany({
      where: { ativo: true },
      orderBy: { ordem: 'asc' },
    });
  }

  produtos(ativo?: boolean) {
    return this.prisma.comProduto.findMany({
      where: ativo !== undefined ? { ativo } : {},
      orderBy: { nome: 'asc' },
      take: 500, // teto de segurança: catálogo de produtos (picker)
    });
  }

  /* ──────────────────────────────────────────────────────
     PESSOA / LEAD (deduplicação — PRD §4)
  ────────────────────────────────────────────────────── */

  /**
   * Busca pessoa por email, telefone (normalizado) ou documento (CPF).
   * Se existir: retorna existente + registra nova origem (ComLeadOrigem).
   * Se não existir: cria CrmCliente novo (estagio='lead') + registra origem.
   * Retorna { pessoa, criada: boolean, duplicatas: number }
   */
  async buscarOuCriarPessoa(dto: CriarLeadDto, usuarioId: string) {
    const telefoneNorm = normalizarTelefone(dto.whatsapp);

    // Deduplicação: telefone (principal) → email
    const existente = await this.prisma.crmCliente.findFirst({
      where: {
        OR: [
          ...(telefoneNorm ? [{ telefone: { contains: telefoneNorm } }] : []),
          ...(dto.email ? [{ email: { equals: dto.email, mode: 'insensitive' as Prisma.QueryMode } }] : []),
        ],
      },
    });

    let pessoa = existente;
    let criada = false;

    if (!pessoa) {
      pessoa = await this.prisma.crmCliente.create({
        data: {
          nome: dto.nome,
          estagio: 'lead',
          telefone: dto.whatsapp,
          email: dto.email ?? null,
          origem: dto.origem,
          responsavelId: dto.responsavelId ?? null,
          criadoPor: usuarioId,
          atualizadoEm: new Date(),
        },
      });
      criada = true;
    }

    // Registra origem (PRD §5 — nunca apagar)
    await this.prisma.comLeadOrigem.create({
      data: {
        pessoaId: pessoa.id,
        canal: dto.canal ?? 'manual',
        campanha: dto.campanha ?? null,
        eventoRef: dto.eventoRef ?? null,
        utmSource: dto.utmSource ?? null,
        utmMedium: dto.utmMedium ?? null,
        utmCampaign: dto.utmCampaign ?? null,
        utmContent: dto.utmContent ?? null,
        utmTerm: dto.utmTerm ?? null,
      },
    });

    // Conta quantas origens existem para detectar duplicatas
    const duplicatas = await this.prisma.comLeadOrigem.count({
      where: { pessoaId: pessoa.id },
    });

    return { pessoa, criada, duplicatas };
  }

  /** Verifica se já existe pessoa com esses dados (sem criar). */
  async verificarDuplicata(dto: { cpf?: string; email?: string; telefone?: string; nome?: string }) {
    const telefoneNorm = dto.telefone ? normalizarTelefone(dto.telefone) : undefined;
    const orConditions: Prisma.CrmClienteWhereInput[] = [];

    if (dto.cpf) orConditions.push({ documento: dto.cpf.replace(/\D/g, '') });
    if (telefoneNorm) orConditions.push({ telefone: { contains: telefoneNorm } });
    if (dto.email) orConditions.push({ email: { equals: dto.email, mode: 'insensitive' } });

    if (!orConditions.length) return { encontrados: [] };

    const encontrados = await this.prisma.crmCliente.findMany({
      where: { OR: orConditions },
      select: { id: true, nome: true, email: true, telefone: true, documento: true, estagio: true },
      take: 10,
    });

    return { encontrados };
  }

  /* ──────────────────────────────────────────────────────
     OPORTUNIDADES (pipeline)
  ────────────────────────────────────────────────────── */

  async pipeline(filtros: FiltroOportunidadesDto, _usuarioId: string) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 25;

    const where: Prisma.ComOportunidadeWhereInput = {
      ...(filtros.status ? { status: filtros.status } : {}),
      ...(filtros.etapaId ? { etapaId: filtros.etapaId } : {}),
      ...(filtros.funilId ? { funilId: filtros.funilId } : {}),
      ...(filtros.responsavelId ? { responsavelId: filtros.responsavelId } : {}),
      ...(filtros.pessoaId ? { pessoaId: filtros.pessoaId } : {}),
      ...(filtros.origem ? { origem: filtros.origem } : {}),
      ...(filtros.campanha ? { campanha: filtros.campanha } : {}),
      ...(filtros.unidade ? { unidade: filtros.unidade } : {}),
      ...(filtros.periodoInicio || filtros.periodoFim
        ? {
            criadoEm: {
              ...(filtros.periodoInicio ? { gte: new Date(filtros.periodoInicio) } : {}),
              ...(filtros.periodoFim ? { lte: new Date(filtros.periodoFim) } : {}),
            },
          }
        : {}),
    };

    const [total, itens] = await this.prisma.$transaction([
      this.prisma.comOportunidade.count({ where }),
      this.prisma.comOportunidade.findMany({
        where,
        include: {
          pessoa: { select: { id: true, nome: true, email: true, telefone: true, estagio: true } },
          produto: { select: { id: true, nome: true, tipo: true } },
          etapa: { select: { id: true, nome: true, cor: true, tipo: true, ordem: true } },
          funil: { select: { id: true, nome: true } },
          proximasAcoes: {
            where: { concluidaEm: null },
            orderBy: { venceEm: 'asc' },
            take: 1,
          },
        },
        orderBy: { atualizadoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);

    return {
      itens: itens.map((o) => ({
        ...o,
        valorEstimadoCentavos: num(o.valorEstimadoCentavos),
      })),
      total,
      pagina,
      limite,
    };
  }

  async kanban(funilId: string, filtros: FiltroKanbanDto) {
    const funil = await this.prisma.comFunil.findUnique({
      where: { id: funilId },
      include: { etapas: { orderBy: { ordem: 'asc' } } },
    });
    if (!funil) throw new NotFoundException({ codigo: 'FUNIL_NAO_ENCONTRADO', message: 'Funil não encontrado' });

    const where: Prisma.ComOportunidadeWhereInput = {
      funilId,
      status: 'aberta',
      ...(filtros.responsavelId ? { responsavelId: filtros.responsavelId } : {}),
      ...(filtros.unidade ? { unidade: filtros.unidade } : {}),
      ...(filtros.campanha ? { campanha: filtros.campanha } : {}),
    };

    const oportunidades = await this.prisma.comOportunidade.findMany({
      where,
      include: {
        pessoa: { select: { id: true, nome: true, telefone: true } },
        produto: { select: { id: true, nome: true } },
        proximasAcoes: {
          where: { concluidaEm: null },
          orderBy: { venceEm: 'asc' },
          take: 1,
        },
      },
      orderBy: { atualizadoEm: 'desc' },
    });

    const colunas = funil.etapas.map((etapa) => {
      const cards = oportunidades.filter((o) => o.etapaId === etapa.id);
      return {
        etapa: {
          id: etapa.id,
          nome: etapa.nome,
          cor: etapa.cor,
          tipo: etapa.tipo,
          ordem: etapa.ordem,
        },
        total: cards.length,
        valorTotalCentavos: cards.reduce((acc, o) => acc + num(o.valorEstimadoCentavos), 0),
        cards: cards.map((o) => ({
          ...o,
          valorEstimadoCentavos: num(o.valorEstimadoCentavos),
        })),
      };
    });

    return { funil: { id: funil.id, nome: funil.nome }, colunas };
  }

  async minhaOperacao(usuarioId: string) {
    const agora = new Date();
    const inicioDia = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
    const fimDia = new Date(inicioDia.getTime() + 86_400_000);

    const [
      leadsNovos,
      oportunidadesAtrasadas,
      semProximaAcao,
      negociacoesPendentes,
      vendasHoje,
    ] = await Promise.all([
      // Leads criados hoje sob minha responsabilidade
      this.prisma.comOportunidade.count({
        where: {
          responsavelId: usuarioId,
          status: 'aberta',
          criadoEm: { gte: inicioDia, lt: fimDia },
        },
      }),
      // Oportunidades com próxima ação vencida
      this.prisma.comOportunidade.count({
        where: {
          responsavelId: usuarioId,
          status: 'aberta',
          proximasAcoes: { some: { concluidaEm: null, venceEm: { lt: agora } } },
        },
      }),
      // Oportunidades abertas sem próxima ação pendente
      this.prisma.comOportunidade.count({
        where: {
          responsavelId: usuarioId,
          status: 'aberta',
          proximasAcoes: { none: { concluidaEm: null } },
        },
      }),
      // Negociações aguardando aprovação
      this.prisma.comNegociacao.count({
        where: {
          oportunidade: { responsavelId: usuarioId },
          statusAprovacao: 'em_analise',
        },
      }),
      // Vendas criadas hoje
      this.prisma.comVenda.count({
        where: {
          vendedorId: usuarioId,
          criadoEm: { gte: inicioDia, lt: fimDia },
        },
      }),
    ]);

    // Próximas ações para hoje
    const acoesHoje = await this.prisma.comProximaAcao.findMany({
      where: {
        responsavelId: usuarioId,
        concluidaEm: null,
        venceEm: { gte: inicioDia, lt: fimDia },
      },
      include: {
        oportunidade: {
          select: { id: true, pessoa: { select: { id: true, nome: true } }, produto: { select: { nome: true } } },
        },
      },
      orderBy: { venceEm: 'asc' },
      take: 20,
    });

    return {
      leadsNovos,
      oportunidadesAtrasadas,
      semProximaAcao,
      negociacoesPendentes,
      vendasHoje,
      acoesHoje,
    };
  }

  async criarOportunidade(dto: CriarOportunidadeDto, u: UsuarioLogado, ip?: string) {
    // Validar etapa pertence ao funil
    const etapa = await this.prisma.comEtapa.findFirst({
      where: { id: dto.etapaId, funilId: dto.funilId },
    });
    if (!etapa) {
      throw new BadRequestException({ codigo: 'ETAPA_INVALIDA', message: 'Etapa não pertence ao funil informado' });
    }

    // Buscar produto para desnormalizar nome
    const produto = dto.produtoId
      ? await this.prisma.comProduto.findUnique({ where: { id: dto.produtoId } })
      : null;

    const oportunidade = await this.prisma.comOportunidade.create({
      data: {
        pessoaId: dto.pessoaId,
        produtoId: dto.produtoId ?? null,
        produtoNome: produto?.nome ?? null,
        funilId: dto.funilId,
        etapaId: dto.etapaId,
        responsavelId: dto.responsavelId ?? u.id,
        unidade: dto.unidade ?? null,
        valorEstimadoCentavos: BigInt(dto.valorEstimadoCentavos ?? 0),
        origem: dto.origem ?? null,
        canal: dto.canal ?? null,
        campanha: dto.campanha ?? null,
        eventoRef: dto.eventoRef ?? null,
        utmSource: dto.utmSource ?? null,
        utmMedium: dto.utmMedium ?? null,
        utmCampaign: dto.utmCampaign ?? null,
        observacao: dto.observacao ?? null,
        criadoPor: u.id,
        status: 'aberta',
        historico: {
          create: {
            tipo: 'oportunidade_criada',
            titulo: 'Oportunidade criada',
            descricao: `Oportunidade criada na etapa "${etapa.nome}"`,
            etapaNova: etapa.nome,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
      include: {
        pessoa: { select: { id: true, nome: true, email: true, telefone: true } },
        produto: { select: { id: true, nome: true } },
        etapa: { select: { id: true, nome: true, cor: true, tipo: true } },
        funil: { select: { id: true, nome: true } },
      },
    });

    await this.auditar(u, 'com_oportunidade_criada', `comercial/oportunidades/${oportunidade.id}`, {
      pessoaId: dto.pessoaId,
      funilId: dto.funilId,
    }, ip);

    return { ...oportunidade, valorEstimadoCentavos: num(oportunidade.valorEstimadoCentavos) };
  }

  async obterOportunidade(id: string, _usuarioId: string) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({
      where: { id },
      include: {
        pessoa: true,
        produto: true,
        etapa: true,
        funil: { include: { etapas: { orderBy: { ordem: 'asc' } } } },
        motivoPerda: true,
        historico: { orderBy: { criadoEm: 'desc' }, take: 80 },
        proximasAcoes: { orderBy: [{ concluidaEm: 'asc' }, { venceEm: 'asc' }] },
        negociacao: { include: { produto: true } },
        venda: { select: { id: true, numero: true, statusComercial: true, statusFinanceiro: true, criadoEm: true } },
        responsavelHistorico: { orderBy: { criadoEm: 'desc' }, take: 20 },
      },
    });

    if (!oportunidade) {
      throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });
    }

    return {
      ...oportunidade,
      valorEstimadoCentavos: num(oportunidade.valorEstimadoCentavos),
      negociacao: oportunidade.negociacao
        ? {
            ...oportunidade.negociacao,
            precoTabelaCentavos: num(oportunidade.negociacao.precoTabelaCentavos),
            descontoCentavos: num(oportunidade.negociacao.descontoCentavos),
            valorNegociadoCentavos: num(oportunidade.negociacao.valorNegociadoCentavos),
            entradaCentavos: num(oportunidade.negociacao.entradaCentavos),
            saldoCentavos: num(oportunidade.negociacao.saldoCentavos),
            valorParcelaCentavos: num(oportunidade.negociacao.valorParcelaCentavos),
          }
        : null,
    };
  }

  async atualizarOportunidade(id: string, dto: AtualizarOportunidadeDto, u: UsuarioLogado, ip?: string) {
    const anterior = await this.prisma.comOportunidade.findUnique({ where: { id } });
    if (!anterior) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    // Verificar etapa/funil se fornecidos
    if (dto.etapaId && dto.funilId) {
      const etapa = await this.prisma.comEtapa.findFirst({ where: { id: dto.etapaId, funilId: dto.funilId } });
      if (!etapa) throw new BadRequestException({ codigo: 'ETAPA_INVALIDA', message: 'Etapa não pertence ao funil' });
    }

    const produto = dto.produtoId
      ? await this.prisma.comProduto.findUnique({ where: { id: dto.produtoId } })
      : null;

    const atualizada = await this.prisma.comOportunidade.update({
      where: { id },
      data: {
        ...(dto.pessoaId !== undefined ? { pessoaId: dto.pessoaId } : {}),
        ...(dto.produtoId !== undefined ? { produtoId: dto.produtoId, produtoNome: produto?.nome ?? null } : {}),
        ...(dto.funilId !== undefined ? { funilId: dto.funilId } : {}),
        ...(dto.etapaId !== undefined ? { etapaId: dto.etapaId } : {}),
        ...(dto.responsavelId !== undefined ? { responsavelId: dto.responsavelId } : {}),
        ...(dto.unidade !== undefined ? { unidade: dto.unidade } : {}),
        ...(dto.valorEstimadoCentavos !== undefined ? { valorEstimadoCentavos: BigInt(dto.valorEstimadoCentavos) } : {}),
        ...(dto.origem !== undefined ? { origem: dto.origem } : {}),
        ...(dto.canal !== undefined ? { canal: dto.canal } : {}),
        ...(dto.campanha !== undefined ? { campanha: dto.campanha } : {}),
        ...(dto.eventoRef !== undefined ? { eventoRef: dto.eventoRef } : {}),
        ...(dto.utmSource !== undefined ? { utmSource: dto.utmSource } : {}),
        ...(dto.utmMedium !== undefined ? { utmMedium: dto.utmMedium } : {}),
        ...(dto.utmCampaign !== undefined ? { utmCampaign: dto.utmCampaign } : {}),
        ...(dto.observacao !== undefined ? { observacao: dto.observacao } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.motivoPerdaId !== undefined ? { motivoPerdaId: dto.motivoPerdaId } : {}),
        ...(dto.motivoPerdaTexto !== undefined ? { motivoPerdaTexto: dto.motivoPerdaTexto } : {}),
        ...(dto.proximaAcaoEm !== undefined ? { proximaAcaoEm: new Date(dto.proximaAcaoEm) } : {}),
        ...(dto.proximaAcaoDescricao !== undefined ? { proximaAcaoDescricao: dto.proximaAcaoDescricao } : {}),
        ...(dto.turmaId !== undefined ? { turmaId: dto.turmaId } : {}),
        ...(dto.turmaADefinir !== undefined ? { turmaADefinir: dto.turmaADefinir } : {}),
        atualizadoEm: new Date(),
      },
    });

    // Registra alteração relevante no histórico
    await this.prisma.comOportunidadeHistorico.create({
      data: {
        oportunidadeId: id,
        tipo: 'nota',
        titulo: 'Oportunidade atualizada',
        usuarioId: u.id,
        origem: 'usuario',
      },
    });

    await this.auditar(u, 'com_oportunidade_atualizada', `comercial/oportunidades/${id}`, undefined, ip);

    return { ...atualizada, valorEstimadoCentavos: num(atualizada.valorEstimadoCentavos) };
  }

  async moverEtapa(id: string, dto: MoverEtapaDto, u: UsuarioLogado, ip?: string) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({
      where: { id },
      include: { etapa: true },
    });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    const novaEtapa = await this.prisma.comEtapa.findFirst({
      where: { id: dto.etapaId, funilId: oportunidade.funilId },
    });
    if (!novaEtapa) {
      throw new BadRequestException({ codigo: 'ETAPA_INVALIDA', message: 'Etapa não pertence ao funil desta oportunidade' });
    }

    // Perda exige motivo (etapa.exigeMotivo OU etapa.tipo === 'perdida')
    if ((novaEtapa.tipo === 'perdida' || novaEtapa.exigeMotivo) && !dto.motivoPerdaId && !dto.motivoPerdaTexto?.trim()) {
      throw new BadRequestException({ codigo: 'MOTIVO_OBRIGATORIO', message: 'Mover para etapa de perda exige motivo' });
    }

    const fechadaEm = novaEtapa.tipo !== 'aberta' ? new Date() : null;
    const novoStatus = novaEtapa.tipo === 'ganha' ? 'ganha'
      : novaEtapa.tipo === 'perdida' ? 'perdida'
      : 'aberta';

    const atualizada = await this.prisma.comOportunidade.update({
      where: { id },
      data: {
        etapaId: dto.etapaId,
        status: novoStatus,
        probabilidade: novaEtapa.probabilidade,
        ...(fechadaEm ? { fechadaEm } : {}),
        ...(dto.motivoPerdaId ? { motivoPerdaId: dto.motivoPerdaId } : {}),
        ...(dto.motivoPerdaTexto ? { motivoPerdaTexto: dto.motivoPerdaTexto } : {}),
        atualizadoEm: new Date(),
        historico: {
          create: {
            tipo: 'etapa_mudou',
            titulo: `Etapa: ${oportunidade.etapa.nome} → ${novaEtapa.nome}`,
            etapaAnterior: oportunidade.etapa.nome,
            etapaNova: novaEtapa.nome,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
    });

    await this.auditar(u, 'com_oportunidade_etapa_movida', `comercial/oportunidades/${id}`, {
      de: oportunidade.etapa.nome,
      para: novaEtapa.nome,
    }, ip);

    return { ...atualizada, valorEstimadoCentavos: num(atualizada.valorEstimadoCentavos) };
  }

  async transferirResponsavel(id: string, dto: TransferirResponsavelDto, u: UsuarioLogado, ip?: string) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({ where: { id } });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    const [atualizada] = await this.prisma.$transaction([
      this.prisma.comOportunidade.update({
        where: { id },
        data: { responsavelId: dto.responsavelNovoId, atualizadoEm: new Date() },
      }),
      this.prisma.comResponsavelHistorico.create({
        data: {
          oportunidadeId: id,
          responsavelAnterior: oportunidade.responsavelId ?? null,
          responsavelNovo: dto.responsavelNovoId,
          alteradoPor: u.id,
          motivo: dto.motivo ?? null,
        },
      }),
      this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId: id,
          tipo: 'transferencia_responsavel',
          titulo: 'Responsável transferido',
          descricao: dto.motivo ?? null,
          responsavelAnterior: oportunidade.responsavelId ?? null,
          responsavelNovo: dto.responsavelNovoId,
          usuarioId: u.id,
          origem: 'usuario',
        },
      }),
    ]);

    await this.auditar(u, 'com_oportunidade_transferida', `comercial/oportunidades/${id}`, {
      para: dto.responsavelNovoId,
    }, ip);

    return { ...atualizada, valorEstimadoCentavos: num(atualizada.valorEstimadoCentavos) };
  }

  async registrarInteracao(id: string, dto: RegistrarInteracaoDto, u: UsuarioLogado) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({ where: { id } });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    const agora = new Date();
    const [historico] = await this.prisma.$transaction([
      this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId: id,
          tipo: dto.tipo,
          titulo: dto.tipo.charAt(0).toUpperCase() + dto.tipo.slice(1),
          descricao: dto.descricao,
          canal: dto.canal ?? null,
          usuarioId: u.id,
          origem: 'usuario',
        },
      }),
      this.prisma.comOportunidade.update({
        where: { id },
        data: { ultimaInteracaoEm: agora, atualizadoEm: agora },
      }),
    ]);

    return historico;
  }

  async criarProximaAcao(id: string, dto: CriarProximaAcaoDto, u: UsuarioLogado) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({ where: { id } });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    const acao = await this.prisma.comProximaAcao.create({
      data: {
        oportunidadeId: id,
        pessoaId: oportunidade.pessoaId,
        responsavelId: oportunidade.responsavelId ?? u.id,
        tipo: dto.tipo,
        titulo: dto.titulo,
        descricao: dto.descricao ?? null,
        venceEm: new Date(dto.venceEm),
        prioridade: dto.prioridade ?? 'media',
        criadoPor: u.id,
      },
    });

    // Registra no histórico
    await this.prisma.comOportunidadeHistorico.create({
      data: {
        oportunidadeId: id,
        tipo: 'proxima_acao',
        titulo: `Próxima ação: ${dto.titulo}`,
        descricao: dto.descricao ?? null,
        usuarioId: u.id,
        origem: 'usuario',
      },
    });

    // Atualiza campo de atalho na oportunidade
    await this.prisma.comOportunidade.update({
      where: { id },
      data: {
        proximaAcaoEm: new Date(dto.venceEm),
        proximaAcaoDescricao: dto.titulo,
        atualizadoEm: new Date(),
      },
    });

    return acao;
  }

  async concluirProximaAcao(
    oportunidadeId: string,
    acaoId: string,
    resultado: string | undefined,
    u: UsuarioLogado,
  ) {
    const acao = await this.prisma.comProximaAcao.findFirst({
      where: { id: acaoId, oportunidadeId },
    });
    if (!acao) throw new NotFoundException({ codigo: 'ACAO_NAO_ENCONTRADA', message: 'Ação não encontrada' });

    const agora = new Date();
    const [acaoConcluida] = await this.prisma.$transaction([
      this.prisma.comProximaAcao.update({
        where: { id: acaoId },
        data: { concluidaEm: agora, resultado: resultado ?? null },
      }),
      this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId,
          tipo: 'proxima_acao',
          titulo: `Ação concluída: ${acao.titulo}`,
          descricao: resultado ?? null,
          usuarioId: u.id,
          origem: 'usuario',
        },
      }),
    ]);

    return acaoConcluida;
  }

  /* ──────────────────────────────────────────────────────
     NEGOCIAÇÃO
  ────────────────────────────────────────────────────── */

  async criarNegociacao(oportunidadeId: string, dto: CriarNegociacaoDto, u: UsuarioLogado, ip?: string) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({ where: { id: oportunidadeId } });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    // Apenas 1 negociação por oportunidade
    const existente = await this.prisma.comNegociacao.findUnique({ where: { oportunidadeId } });
    if (existente) throw new ConflictException({ codigo: 'NEGOCIACAO_DUPLICADA', message: 'Esta oportunidade já possui uma negociação' });

    const produto = dto.produtoId
      ? await this.prisma.comProduto.findUnique({ where: { id: dto.produtoId } })
      : null;

    const saldo = BigInt(dto.valorNegociadoCentavos) - BigInt(dto.entradaCentavos);
    const descontoPerc = dto.precoTabelaCentavos > 0
      ? (dto.descontoCentavos / dto.precoTabelaCentavos) * 100
      : 0;

    const negociacao = await this.prisma.comNegociacao.create({
      data: {
        oportunidadeId,
        produtoId: dto.produtoId ?? oportunidade.produtoId ?? null,
        produtoNome: dto.produtoNome ?? produto?.nome ?? oportunidade.produtoNome ?? null,
        quantidade: dto.quantidade,
        precoTabelaCentavos: BigInt(dto.precoTabelaCentavos),
        descontoCentavos: BigInt(dto.descontoCentavos),
        descontoPercentual: descontoPerc,
        valorNegociadoCentavos: BigInt(dto.valorNegociadoCentavos),
        entradaCentavos: BigInt(dto.entradaCentavos),
        saldoCentavos: saldo,
        numParcelas: dto.numParcelas,
        valorParcelaCentavos: BigInt(dto.valorParcelaCentavos),
        formaPagamento: dto.formaPagamento,
        vencimentos: dto.vencimentos ?? [],
        condicaoEspecial: dto.condicaoEspecial ?? null,
        observacao: dto.observacao ?? null,
        turmaId: dto.turmaId ?? oportunidade.turmaId ?? null,
        turmaADefinir: dto.turmaADefinir ?? oportunidade.turmaADefinir,
        statusAprovacao: 'rascunho',
        criadoPor: u.id,
      },
    });

    // Atualiza valor estimado da oportunidade com o valor negociado
    await this.prisma.comOportunidade.update({
      where: { id: oportunidadeId },
      data: {
        valorEstimadoCentavos: BigInt(dto.valorNegociadoCentavos),
        atualizadoEm: new Date(),
      },
    });

    await this.prisma.comOportunidadeHistorico.create({
      data: {
        oportunidadeId,
        tipo: 'proposta',
        titulo: 'Negociação criada',
        descricao: `R$ ${(dto.valorNegociadoCentavos / 100).toFixed(2)} em ${dto.numParcelas}x`,
        usuarioId: u.id,
        origem: 'usuario',
      },
    });

    await this.auditar(u, 'com_negociacao_criada', `comercial/oportunidades/${oportunidadeId}/negociacao`, {
      valorNegociadoCentavos: dto.valorNegociadoCentavos,
    }, ip);

    return {
      ...negociacao,
      precoTabelaCentavos: num(negociacao.precoTabelaCentavos),
      descontoCentavos: num(negociacao.descontoCentavos),
      valorNegociadoCentavos: num(negociacao.valorNegociadoCentavos),
      entradaCentavos: num(negociacao.entradaCentavos),
      saldoCentavos: num(negociacao.saldoCentavos),
      valorParcelaCentavos: num(negociacao.valorParcelaCentavos),
    };
  }

  async obterNegociacao(oportunidadeId: string) {
    const negociacao = await this.prisma.comNegociacao.findUnique({
      where: { oportunidadeId },
      include: { produto: { select: { id: true, nome: true, tipo: true } } },
    });
    if (!negociacao) throw new NotFoundException({ codigo: 'NEGOCIACAO_NAO_ENCONTRADA', message: 'Negociação não encontrada' });

    return {
      ...negociacao,
      precoTabelaCentavos: num(negociacao.precoTabelaCentavos),
      descontoCentavos: num(negociacao.descontoCentavos),
      valorNegociadoCentavos: num(negociacao.valorNegociadoCentavos),
      entradaCentavos: num(negociacao.entradaCentavos),
      saldoCentavos: num(negociacao.saldoCentavos),
      valorParcelaCentavos: num(negociacao.valorParcelaCentavos),
    };
  }

  async atualizarNegociacao(oportunidadeId: string, dto: AtualizarNegociacaoDto, u: UsuarioLogado, ip?: string) {
    const negociacao = await this.prisma.comNegociacao.findUnique({ where: { oportunidadeId } });
    if (!negociacao) throw new NotFoundException({ codigo: 'NEGOCIACAO_NAO_ENCONTRADA', message: 'Negociação não encontrada' });
    if (negociacao.statusAprovacao === 'aprovada') {
      throw new BadRequestException({ codigo: 'NEGOCIACAO_APROVADA', message: 'Negociação aprovada não pode ser editada' });
    }

    const produto = dto.produtoId
      ? await this.prisma.comProduto.findUnique({ where: { id: dto.produtoId } })
      : null;

    const precoTabela = dto.precoTabelaCentavos !== undefined ? BigInt(dto.precoTabelaCentavos) : negociacao.precoTabelaCentavos;
    const desconto = dto.descontoCentavos !== undefined ? BigInt(dto.descontoCentavos) : negociacao.descontoCentavos;
    const valorNeg = dto.valorNegociadoCentavos !== undefined ? BigInt(dto.valorNegociadoCentavos) : negociacao.valorNegociadoCentavos;
    const entrada = dto.entradaCentavos !== undefined ? BigInt(dto.entradaCentavos) : negociacao.entradaCentavos;
    const saldo = valorNeg - entrada;
    const descontoPerc = Number(precoTabela) > 0 ? (Number(desconto) / Number(precoTabela)) * 100 : 0;

    const atualizada = await this.prisma.comNegociacao.update({
      where: { oportunidadeId },
      data: {
        ...(dto.produtoId !== undefined ? { produtoId: dto.produtoId, produtoNome: produto?.nome ?? dto.produtoNome ?? null } : {}),
        ...(dto.produtoNome !== undefined && !dto.produtoId ? { produtoNome: dto.produtoNome } : {}),
        ...(dto.quantidade !== undefined ? { quantidade: dto.quantidade } : {}),
        precoTabelaCentavos: precoTabela,
        descontoCentavos: desconto,
        descontoPercentual: descontoPerc,
        valorNegociadoCentavos: valorNeg,
        entradaCentavos: entrada,
        saldoCentavos: saldo,
        ...(dto.numParcelas !== undefined ? { numParcelas: dto.numParcelas } : {}),
        ...(dto.valorParcelaCentavos !== undefined ? { valorParcelaCentavos: BigInt(dto.valorParcelaCentavos) } : {}),
        ...(dto.formaPagamento !== undefined ? { formaPagamento: dto.formaPagamento } : {}),
        ...(dto.vencimentos !== undefined ? { vencimentos: dto.vencimentos } : {}),
        ...(dto.condicaoEspecial !== undefined ? { condicaoEspecial: dto.condicaoEspecial } : {}),
        ...(dto.observacao !== undefined ? { observacao: dto.observacao } : {}),
        ...(dto.turmaId !== undefined ? { turmaId: dto.turmaId } : {}),
        ...(dto.turmaADefinir !== undefined ? { turmaADefinir: dto.turmaADefinir } : {}),
        atualizadoEm: new Date(),
      },
    });

    await this.auditar(u, 'com_negociacao_atualizada', `comercial/oportunidades/${oportunidadeId}/negociacao`, undefined, ip);

    return {
      ...atualizada,
      precoTabelaCentavos: num(atualizada.precoTabelaCentavos),
      descontoCentavos: num(atualizada.descontoCentavos),
      valorNegociadoCentavos: num(atualizada.valorNegociadoCentavos),
      entradaCentavos: num(atualizada.entradaCentavos),
      saldoCentavos: num(atualizada.saldoCentavos),
      valorParcelaCentavos: num(atualizada.valorParcelaCentavos),
    };
  }

  /* ──────────────────────────────────────────────────────
     VENDA
  ────────────────────────────────────────────────────── */

  async fecharVenda(oportunidadeId: string, dto: CriarVendaDto, u: UsuarioLogado, ip?: string) {
    const oportunidade = await this.prisma.comOportunidade.findUnique({
      where: { id: oportunidadeId },
      include: {
        negociacao: true,
        etapa: true,
        venda: { select: { id: true, numero: true, statusComercial: true } },
        pessoa: { select: { id: true, nome: true } },
        produto: true,
      },
    });
    if (!oportunidade) throw new NotFoundException({ codigo: 'OPORTUNIDADE_NAO_ENCONTRADA', message: 'Oportunidade não encontrada' });

    // Necessita de negociação
    if (!oportunidade.negociacao) {
      throw new BadRequestException({ codigo: 'SEM_NEGOCIACAO', message: 'Crie uma negociação antes de fechar a venda' });
    }

    // Negociação deve estar aprovada ou em análise (sem alçada)
    const statusOk = ['aprovada', 'rascunho', 'em_analise'].includes(oportunidade.negociacao.statusAprovacao);
    if (!statusOk) {
      throw new BadRequestException({ codigo: 'NEGOCIACAO_RECUSADA', message: 'Negociação foi recusada e não pode gerar venda' });
    }

    // Venda duplicada?
    if (oportunidade['venda']) {
      throw new ConflictException({ codigo: 'VENDA_DUPLICADA', message: 'Esta oportunidade já possui uma venda' });
    }

    // Gera número sequencial via função do banco
    const [{ numero }] = await this.prisma.$queryRaw<{ numero: string }[]>`
      SELECT public.com_proximo_numero_venda() AS numero
    `;

    const neg = oportunidade.negociacao;

    const venda = await this.prisma.comVenda.create({
      data: {
        numero,
        oportunidadeId,
        negociacaoId: neg.id,
        compradorId: oportunidade.pessoaId,
        beneficiarioId: dto.beneficiarioId ?? null,
        beneficiarioNome: dto.beneficiarioNome ?? null,
        vendedorId: dto.vendedorId ?? oportunidade.responsavelId ?? null,
        relacionadoraId: dto.relacionadoraId ?? null,
        unidade: oportunidade.unidade ?? null,
        produtoId: neg.produtoId ?? oportunidade.produtoId ?? null,
        produtoNome: neg.produtoNome ?? oportunidade.produtoNome ?? 'Produto sem nome',
        quantidade: neg.quantidade,
        precoTabelaCentavos: neg.precoTabelaCentavos,
        descontoCentavos: neg.descontoCentavos,
        descontoPercentual: neg.descontoPercentual,
        valorNegociadoCentavos: neg.valorNegociadoCentavos,
        entradaCentavos: neg.entradaCentavos,
        saldoCentavos: neg.saldoCentavos,
        numParcelas: neg.numParcelas,
        valorParcelaCentavos: neg.valorParcelaCentavos,
        formaPagamento: neg.formaPagamento,
        vencimentos: neg.vencimentos ?? [],
        turmaId: neg.turmaId ?? null,
        turmaADefinir: neg.turmaADefinir,
        origem: oportunidade.origem ?? null,
        campanha: oportunidade.campanha ?? null,
        eventoRef: oportunidade.eventoRef ?? null,
        utmSource: oportunidade.utmSource ?? null,
        condicaoEspecial: neg.condicaoEspecial ?? null,
        observacao: dto.observacao ?? null,
        statusComercial: 'aguardando_aprovacao',
        statusFinanceiro: 'pendente',
        criadoPor: u.id,
        historico: {
          create: {
            tipo: 'venda_criada',
            titulo: 'Venda criada',
            descricao: `Número: ${numero}`,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
    });

    // Move oportunidade para etapa 'ganha'
    const etapaGanha = await this.prisma.comEtapa.findFirst({
      where: { funilId: oportunidade.funilId, tipo: 'ganha' },
    });
    if (etapaGanha) {
      await this.prisma.comOportunidade.update({
        where: { id: oportunidadeId },
        data: {
          etapaId: etapaGanha.id,
          status: 'ganha',
          fechadaEm: new Date(),
          atualizadoEm: new Date(),
        },
      });
      await this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId,
          tipo: 'venda_criada',
          titulo: `Venda criada — ${numero}`,
          etapaNova: etapaGanha.nome,
          usuarioId: u.id,
          origem: 'usuario',
        },
      });
    }

    await this.auditar(u, 'com_venda_criada', `comercial/vendas/${venda.id}`, { numero }, ip);

    return this._serializarVenda(venda);
  }

  async aprovarVenda(vendaId: string, observacao: string | undefined, u: UsuarioLogado, ip?: string) {
    const venda = await this.prisma.comVenda.findUnique({ where: { id: vendaId } });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda não encontrada' });
    if (venda.statusComercial === 'aprovada') {
      throw new ConflictException({ codigo: 'JA_APROVADA', message: 'Venda já está aprovada' });
    }
    if (venda.statusComercial === 'cancelada') {
      throw new BadRequestException({ codigo: 'VENDA_CANCELADA', message: 'Venda cancelada não pode ser aprovada' });
    }

    const agora = new Date();
    const atualizada = await this.prisma.comVenda.update({
      where: { id: vendaId },
      data: {
        statusComercial: 'aprovada',
        aprovadoPor: u.id,
        aprovadoEm: agora,
        eventoAprovadaEm: agora,
        atualizadoEm: agora,
        historico: {
          create: {
            tipo: 'venda_aprovada',
            titulo: 'Venda aprovada',
            descricao: observacao ?? null,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
    });

    // Dispara evento corporativo idempotente (VENDA_APROVADA → Financeiro + Pedagógico)
    await this.prisma.comEventoCorporativo.upsert({
      where: { tipo_referenciaTipo_referenciaId: { tipo: 'VENDA_APROVADA', referenciaTipo: 'venda', referenciaId: vendaId } },
      create: {
        tipo: 'VENDA_APROVADA',
        referenciaTipo: 'venda',
        referenciaId: vendaId,
        payload: {
          vendaId,
          numero: atualizada.numero,
          compradorId: atualizada.compradorId,
          produtoId: atualizada.produtoId,
          produtoNome: atualizada.produtoNome,
          valorNegociadoCentavos: num(atualizada.valorNegociadoCentavos),
          turmaId: atualizada.turmaId,
          aprovadoPor: u.id,
          aprovadoEm: agora.toISOString(),
        },
        consumidores: { financeiro: 'pendente', pedagogico: 'pendente' },
        status: 'pendente',
      },
      update: { status: 'pendente', atualizadoEm: agora },
    });

    // Registra no histórico da oportunidade, se houver
    if (atualizada.oportunidadeId) {
      await this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId: atualizada.oportunidadeId,
          tipo: 'venda_aprovada',
          titulo: 'Venda aprovada',
          usuarioId: u.id,
          origem: 'usuario',
        },
      }).catch(() => undefined);
    }

    await this.auditar(u, 'com_venda_aprovada', `comercial/vendas/${vendaId}`, undefined, ip);

    return this._serializarVenda(atualizada);
  }

  async cancelarVenda(vendaId: string, motivo: string, u: UsuarioLogado, ip?: string) {
    const venda = await this.prisma.comVenda.findUnique({ where: { id: vendaId } });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda não encontrada' });
    if (venda.statusComercial === 'cancelada') {
      throw new ConflictException({ codigo: 'JA_CANCELADA', message: 'Venda já está cancelada' });
    }

    const agora = new Date();
    const atualizada = await this.prisma.comVenda.update({
      where: { id: vendaId },
      data: {
        statusComercial: 'cancelada',
        canceladoPor: u.id,
        canceladoEm: agora,
        motivoCancelamento: motivo,
        eventoCanceladaEm: agora,
        atualizadoEm: agora,
        historico: {
          create: {
            tipo: 'venda_cancelada',
            titulo: 'Venda cancelada',
            descricao: motivo,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
    });

    // Dispara evento corporativo idempotente (VENDA_CANCELADA)
    await this.prisma.comEventoCorporativo.upsert({
      where: { tipo_referenciaTipo_referenciaId: { tipo: 'VENDA_CANCELADA', referenciaTipo: 'venda', referenciaId: vendaId } },
      create: {
        tipo: 'VENDA_CANCELADA',
        referenciaTipo: 'venda',
        referenciaId: vendaId,
        payload: { vendaId, numero: atualizada.numero, motivo, canceladoPor: u.id },
        consumidores: { financeiro: 'pendente', pedagogico: 'pendente' },
        status: 'pendente',
      },
      update: { status: 'pendente', atualizadoEm: agora },
    });

    if (atualizada.oportunidadeId) {
      await this.prisma.comOportunidadeHistorico.create({
        data: {
          oportunidadeId: atualizada.oportunidadeId,
          tipo: 'venda_cancelada',
          titulo: 'Venda cancelada',
          descricao: motivo,
          usuarioId: u.id,
          origem: 'usuario',
        },
      }).catch(() => undefined);
    }

    await this.auditar(u, 'com_venda_cancelada', `comercial/vendas/${vendaId}`, { motivo }, ip);

    return this._serializarVenda(atualizada);
  }

  async definirTurma(vendaId: string, turmaId: string, u: UsuarioLogado, ip?: string) {
    const venda = await this.prisma.comVenda.findUnique({ where: { id: vendaId } });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda não encontrada' });

    const agora = new Date();
    const atualizada = await this.prisma.comVenda.update({
      where: { id: vendaId },
      data: {
        turmaId,
        turmaADefinir: false,
        atualizadoEm: agora,
        historico: {
          create: {
            tipo: 'turma_definida',
            titulo: 'Turma definida',
            valorNovo: turmaId,
            usuarioId: u.id,
            origem: 'usuario',
          },
        },
      },
    });

    // Dispara evento TURMA_DEFINIDA
    await this.prisma.comEventoCorporativo.upsert({
      where: { tipo_referenciaTipo_referenciaId: { tipo: 'TURMA_DEFINIDA', referenciaTipo: 'venda', referenciaId: vendaId } },
      create: {
        tipo: 'TURMA_DEFINIDA',
        referenciaTipo: 'venda',
        referenciaId: vendaId,
        payload: { vendaId, turmaId, definidoPor: u.id },
        consumidores: { pedagogico: 'pendente' },
        status: 'pendente',
      },
      update: { payload: { vendaId, turmaId, definidoPor: u.id }, status: 'pendente', atualizadoEm: agora },
    });

    await this.auditar(u, 'com_venda_turma_definida', `comercial/vendas/${vendaId}`, { turmaId }, ip);

    return this._serializarVenda(atualizada);
  }

  async listarVendas(filtros: FiltroVendasDto, _usuarioId: string) {
    const pagina = filtros.pagina ?? 1;
    const limite = filtros.limite ?? 25;

    const where: Prisma.ComVendaWhereInput = {
      ...(filtros.statusComercial ? { statusComercial: filtros.statusComercial } : {}),
      ...(filtros.statusFinanceiro ? { statusFinanceiro: filtros.statusFinanceiro } : {}),
      ...(filtros.vendedorId ? { vendedorId: filtros.vendedorId } : {}),
      ...(filtros.compradorId ? { compradorId: filtros.compradorId } : {}),
      ...(filtros.unidade ? { unidade: filtros.unidade } : {}),
      ...(filtros.periodoInicio || filtros.periodoFim
        ? {
            criadoEm: {
              ...(filtros.periodoInicio ? { gte: new Date(filtros.periodoInicio) } : {}),
              ...(filtros.periodoFim ? { lte: new Date(filtros.periodoFim) } : {}),
            },
          }
        : {}),
    };

    const [total, itens] = await this.prisma.$transaction([
      this.prisma.comVenda.count({ where }),
      this.prisma.comVenda.findMany({
        where,
        include: {
          comprador: { select: { id: true, nome: true, email: true, telefone: true } },
          produto: { select: { id: true, nome: true, tipo: true } },
          oportunidade: { select: { id: true, etapa: { select: { nome: true } } } },
        },
        orderBy: { criadoEm: 'desc' },
        skip: (pagina - 1) * limite,
        take: limite,
      }),
    ]);

    return {
      itens: itens.map((v) => this._serializarVenda(v)),
      total,
      pagina,
      limite,
    };
  }

  async obterVenda(id: string) {
    const venda = await this.prisma.comVenda.findUnique({
      where: { id },
      include: {
        comprador: true,
        beneficiario: { select: { id: true, nome: true, email: true } },
        produto: true,
        oportunidade: { select: { id: true, etapa: { select: { nome: true } }, funil: { select: { nome: true } } } },
        negociacao: true,
        historico: { orderBy: { criadoEm: 'desc' }, take: 80 },
      },
    });
    if (!venda) throw new NotFoundException({ codigo: 'VENDA_NAO_ENCONTRADA', message: 'Venda não encontrada' });

    return {
      ...this._serializarVenda(venda),
      negociacao: venda.negociacao
        ? {
            ...venda.negociacao,
            precoTabelaCentavos: num(venda.negociacao.precoTabelaCentavos),
            descontoCentavos: num(venda.negociacao.descontoCentavos),
            valorNegociadoCentavos: num(venda.negociacao.valorNegociadoCentavos),
            entradaCentavos: num(venda.negociacao.entradaCentavos),
            saldoCentavos: num(venda.negociacao.saldoCentavos),
            valorParcelaCentavos: num(venda.negociacao.valorParcelaCentavos),
          }
        : null,
    };
  }

  /* ──────────────────────────────────────────────────────
     DASHBOARD
  ────────────────────────────────────────────────────── */

  async dashboard(filtros: FiltroDashboardDto) {
    const agora = new Date();
    const inicio = filtros.periodoInicio ? new Date(filtros.periodoInicio) : new Date(agora.getFullYear(), agora.getMonth(), 1);
    const fim = filtros.periodoFim ? new Date(filtros.periodoFim) : agora;

    const whereBase: Prisma.ComOportunidadeWhereInput = {
      ...(filtros.funilId ? { funilId: filtros.funilId } : {}),
      ...(filtros.unidade ? { unidade: filtros.unidade } : {}),
      ...(filtros.responsavelId ? { responsavelId: filtros.responsavelId } : {}),
    };

    const [
      leadsNoPeriodo,
      oportunidadesAbertas,
      pipelineAgregado,
      vendasFechadas,
      followUpsAtrasados,
      semProximaAcao,
    ] = await Promise.all([
      // Leads criados no período
      this.prisma.comOportunidade.count({
        where: { ...whereBase, criadoEm: { gte: inicio, lte: fim } },
      }),
      // Oportunidades abertas por etapa
      this.prisma.comOportunidade.groupBy({
        by: ['etapaId'],
        where: { ...whereBase, status: 'aberta' },
        _count: true,
        _sum: { valorEstimadoCentavos: true },
      }),
      // Pipeline total
      this.prisma.comOportunidade.aggregate({
        where: { ...whereBase, status: 'aberta' },
        _count: true,
        _sum: { valorEstimadoCentavos: true },
      }),
      // Vendas no período
      this.prisma.comVenda.aggregate({
        where: {
          ...(filtros.unidade ? { unidade: filtros.unidade } : {}),
          ...(filtros.responsavelId ? { vendedorId: filtros.responsavelId } : {}),
          statusComercial: { in: ['aprovada', 'aguardando_aprovacao'] },
          criadoEm: { gte: inicio, lte: fim },
        },
        _count: true,
        _sum: { valorNegociadoCentavos: true },
      }),
      // Follow-ups atrasados
      this.prisma.comProximaAcao.count({
        where: {
          concluidaEm: null,
          venceEm: { lt: agora },
          oportunidade: { ...whereBase, status: 'aberta' },
        },
      }),
      // Oportunidades abertas sem próxima ação
      this.prisma.comOportunidade.count({
        where: {
          ...whereBase,
          status: 'aberta',
          proximasAcoes: { none: { concluidaEm: null } },
        },
      }),
    ]);

    const pipelineTotalCentavos = num(pipelineAgregado._sum.valorEstimadoCentavos);
    const valorVendidoCentavos = num(vendasFechadas._sum.valorNegociadoCentavos);
    const totalLeads = leadsNoPeriodo;
    const totalVendas = vendasFechadas._count;
    const conversaoPercent = totalLeads > 0 ? (totalVendas / totalLeads) * 100 : 0;
    const ticketMedioCentavos = totalVendas > 0 ? Math.round(valorVendidoCentavos / totalVendas) : 0;

    return {
      periodo: { inicio: inicio.toISOString(), fim: fim.toISOString() },
      leadsNoPeriodo: totalLeads,
      oportunidadesAbertasPorEtapa: oportunidadesAbertas.map((g) => ({
        etapaId: g.etapaId,
        total: g._count,
        valorCentavos: num(g._sum.valorEstimadoCentavos),
      })),
      pipelineTotalCentavos,
      pipelineTotalOportunidades: pipelineAgregado._count,
      vendasFechadasTotal: totalVendas,
      valorVendidoCentavos,
      conversaoPercent: Math.round(conversaoPercent * 10) / 10,
      followUpsAtrasados,
      semProximaAcao,
      ticketMedioCentavos,
    };
  }

  /* ──────────────────────────────────────────────────────
     SALESFORCE (stub)
  ────────────────────────────────────────────────────── */

  async sincronizarSalesforce(entidade: string, dados: Record<string, unknown>) {
    const entidadeId = String(dados['id'] ?? '');
    const sfId = String(dados['sfId'] ?? dados['Id'] ?? '');

    if (!entidadeId || !sfId) {
      return { sincronizado: false, motivo: 'IDs insuficientes' };
    }

    const sync = await this.prisma.comSalesforceSync.upsert({
      where: { entidadeTipo_entidadeId: { entidadeTipo: entidade, entidadeId } },
      create: {
        entidadeTipo: entidade,
        entidadeId,
        sfId,
        sfObjeto: String(dados['objeto'] ?? entidade),
        direcao: 'sf_para_erp',
        status: 'ok',
        ultimaSyncEm: new Date(),
        sistemaOrigem: 'salesforce',
      },
      update: {
        sfId,
        status: 'ok',
        ultimaSyncEm: new Date(),
        atualizadoEm: new Date(),
      },
    });

    return { sincronizado: true, sync };
  }

  /* ─── helpers privados ─── */

  private _serializarVenda(v: Record<string, unknown>) {
    return {
      ...v,
      precoTabelaCentavos: num(v['precoTabelaCentavos'] as bigint),
      descontoCentavos: num(v['descontoCentavos'] as bigint),
      valorNegociadoCentavos: num(v['valorNegociadoCentavos'] as bigint),
      entradaCentavos: num(v['entradaCentavos'] as bigint),
      saldoCentavos: num(v['saldoCentavos'] as bigint),
      valorParcelaCentavos: num(v['valorParcelaCentavos'] as bigint),
    };
  }
}
