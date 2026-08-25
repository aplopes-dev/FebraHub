import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import {
  AtualizarTurmaDto, CriarTurmaDto, FiltrosTurmaQuery,
} from '../dto/turma.dto';

@Injectable()
export class TurmasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(q: FiltrosTurmaQuery) {
    const pagina   = q.pagina   ?? 1;
    const porPagina = q.porPagina ?? 50;
    const where: Prisma.PedagogicoTurmaWhereInput = {};

    if (q.status)   where.status   = q.status;
    if (q.unidade)  where.unidade  = { contains: q.unidade,  mode: 'insensitive' };
    if (q.cursoId)  where.cursoId  = q.cursoId;
    if (q.busca) {
      where.OR = [
        { nome:      { contains: q.busca, mode: 'insensitive' } },
        { cursoNome: { contains: q.busca, mode: 'insensitive' } },
        { treinador: { contains: q.busca, mode: 'insensitive' } },
        { turmaIdSf: { contains: q.busca, mode: 'insensitive' } },
      ];
    }
    if (q.dataInicioDe) where.dataInicio = { ...where.dataInicio as object, gte: new Date(q.dataInicioDe) };
    if (q.dataInicioAte) where.dataInicio = { ...where.dataInicio as object, lte: new Date(q.dataInicioAte) };

    const [total, turmas] = await Promise.all([
      this.prisma.pedagogicoTurma.count({ where }),
      this.prisma.pedagogicoTurma.findMany({
        where,
        orderBy: [{ dataInicio: 'asc' }, { nome: 'asc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: {
          _count: { select: { matriculas: true, credenciamentos: true, presencas: true } },
        },
      }),
    ]);

    // Contagens por status de matrícula para cada turma
    const ids = turmas.map(t => t.id);
    const contagens = ids.length > 0 ? await this.prisma.pedagogicoMatricula.groupBy({
      by: ['turmaId', 'status'],
      where: { turmaId: { in: ids } },
      _count: { id: true },
    }) : [];

    const contagemMap = new Map<string, Record<string, number>>();
    for (const c of contagens) {
      const m = contagemMap.get(c.turmaId) ?? {};
      m[c.status] = c._count.id;
      contagemMap.set(c.turmaId, m);
    }

    return {
      pagina,
      porPagina,
      total,
      itens: turmas.map(t => this.formatarTurma(t, contagemMap.get(t.id) ?? {})),
    };
  }

  async buscarPorId(id: string) {
    const turma = await this.prisma.pedagogicoTurma.findUnique({
      where: { id },
      include: {
        matriculas: {
          orderBy: { criadoEm: 'asc' },
          select: {
            id: true, pessoaId: true, pessoaNome: true, pessoaCpf: true,
            pessoaTelefone: true, pessoaEmail: true, status: true,
            dataCompra: true, validadeFim: true, criadoEm: true,
            cursoNome: true, origem: true,
            credenciamento: { select: { criadoEm: true, tipo: true } },
            presencas: { select: { diaNume: true, sessao: true, status: true, entradaEm: true } },
          },
        },
        escalas: {
          include: { monitor: { select: { id: true, nome: true, email: true, funcao: true } } },
          orderBy: { criadoEm: 'asc' },
        },
        _count: { select: { matriculas: true, credenciamentos: true } },
      },
    });
    if (!turma) throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA', message: 'Turma não encontrada' });
    return turma;
  }

  async criar(dto: CriarTurmaDto, usuario: UsuarioLogado) {
    // Idempotência: se turmaIdSf informado e já existe, retorna a existente
    if (dto.turmaIdSf) {
      const existente = await this.prisma.pedagogicoTurma.findUnique({ where: { turmaIdSf: dto.turmaIdSf } });
      if (existente) return existente;
    }

    const turma = await this.prisma.pedagogicoTurma.create({
      data: {
        nome:                 dto.nome,
        cursoNome:            dto.cursoNome,
        turmaIdSf:            dto.turmaIdSf ?? null,
        dimTurmaId:           dto.dimTurmaId ?? null,
        cursoId:              dto.cursoId ?? null,
        unidade:              dto.unidade ?? null,
        local:                dto.local ?? null,
        endereco:             dto.endereco ?? null,
        dataInicio:           dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataFim:              dto.dataFim    ? new Date(dto.dataFim)    : null,
        horarioInicio:        dto.horarioInicio ?? null,
        horarioFim:           dto.horarioFim ?? null,
        horarioCredenciamento: dto.horarioCredenciamento ?? null,
        treinador:            dto.treinador ?? null,
        responsavelId:        dto.responsavelId ?? null,
        capacidade:           dto.capacidade ?? 30,
        status:               dto.status ?? 'Planejada',
        linkGrupo:            dto.linkGrupo ?? null,
        linkExterno:          dto.linkExterno ?? null,
        sigla:                dto.sigla ?? null,
        anoFiscal:            dto.anoFiscal ?? null,
        observacoes:          dto.observacoes ?? null,
        criadoPor:            usuario.id as unknown as string,
      },
    });

    return turma;
  }

  async atualizar(id: string, dto: AtualizarTurmaDto, usuario: UsuarioLogado) {
    const turma = await this.prisma.pedagogicoTurma.findUnique({ where: { id } });
    if (!turma) throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA', message: 'Turma não encontrada' });

    if (dto.turmaIdSf && dto.turmaIdSf !== turma.turmaIdSf) {
      const conflito = await this.prisma.pedagogicoTurma.findUnique({ where: { turmaIdSf: dto.turmaIdSf } });
      if (conflito && conflito.id !== id) {
        throw new ConflictException({ codigo: 'SF_ID_DUPLICADO', message: 'ID Salesforce já está em uso' });
      }
    }

    return this.prisma.pedagogicoTurma.update({
      where: { id },
      data: {
        nome:                 dto.nome,
        cursoNome:            dto.cursoNome,
        turmaIdSf:            dto.turmaIdSf ?? null,
        dimTurmaId:           dto.dimTurmaId ?? null,
        cursoId:              dto.cursoId ?? null,
        unidade:              dto.unidade ?? null,
        local:                dto.local ?? null,
        endereco:             dto.endereco ?? null,
        dataInicio:           dto.dataInicio ? new Date(dto.dataInicio) : null,
        dataFim:              dto.dataFim    ? new Date(dto.dataFim)    : null,
        horarioInicio:        dto.horarioInicio ?? null,
        horarioFim:           dto.horarioFim ?? null,
        horarioCredenciamento: dto.horarioCredenciamento ?? null,
        treinador:            dto.treinador ?? null,
        responsavelId:        dto.responsavelId ?? null,
        capacidade:           dto.capacidade ?? null,
        status:               dto.status ?? undefined,
        linkGrupo:            dto.linkGrupo ?? null,
        linkExterno:          dto.linkExterno ?? null,
        sigla:                dto.sigla ?? null,
        anoFiscal:            dto.anoFiscal ?? null,
        observacoes:          dto.observacoes ?? null,
        atualizadoEm:         new Date(),
      },
    });
  }

  async mudarStatus(id: string, novoStatus: string, usuario: UsuarioLogado) {
    const turma = await this.prisma.pedagogicoTurma.findUnique({ where: { id } });
    if (!turma) throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA', message: 'Turma não encontrada' });
    return this.prisma.pedagogicoTurma.update({
      where: { id },
      data: { status: novoStatus, atualizadoEm: new Date() },
    });
  }

  private formatarTurma(turma: any, statusContagem: Record<string, number>) {
    const total = Object.values(statusContagem).reduce((a, b) => a + b, 0);
    return {
      id:                    turma.id,
      nome:                  turma.nome,
      cursoNome:             turma.cursoNome,
      cursoId:               turma.cursoId,
      turmaIdSf:             turma.turmaIdSf,
      unidade:               turma.unidade,
      local:                 turma.local,
      endereco:              turma.endereco,
      dataInicio:            turma.dataInicio?.toISOString().slice(0, 10) ?? null,
      dataFim:               turma.dataFim?.toISOString().slice(0, 10) ?? null,
      horarioInicio:         turma.horarioInicio,
      horarioFim:            turma.horarioFim,
      horarioCredenciamento: turma.horarioCredenciamento,
      treinador:             turma.treinador,
      responsavelId:         turma.responsavelId,
      capacidade:            turma.capacidade,
      status:                turma.status,
      linkGrupo:             turma.linkGrupo,
      linkExterno:           turma.linkExterno,
      sigla:                 turma.sigla,
      anoFiscal:             turma.anoFiscal,
      observacoes:           turma.observacoes,
      criadoEm:              turma.criadoEm?.toISOString() ?? null,
      atualizadoEm:          turma.atualizadoEm?.toISOString() ?? null,
      // Indicadores
      matriculados:   total,
      confirmados:    statusContagem['Confirmado'] ?? 0,
      presentes:      statusContagem['Em Curso'] ?? statusContagem['Concluído'] ?? 0,
      represados:     statusContagem['Represado'] ?? 0,
      credenciados:   turma._count?.credenciamentos ?? 0,
    };
  }
}
