import {
  BadRequestException, ConflictException, Injectable, NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import {
  AtualizarStatusMatriculaDto, CriarMatriculaDto, FiltrosMatriculaQuery, IntegrarVendaDto,
} from '../dto/matricula.dto';

@Injectable()
export class MatriculasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(q: FiltrosMatriculaQuery) {
    const pagina    = q.pagina    ?? 1;
    const porPagina = q.porPagina ?? 50;
    const where: Prisma.PedagogicoMatriculaWhereInput = {};

    if (q.status)   where.status  = q.status;
    if (q.turmaId)  where.turmaId = q.turmaId;
    if (q.cursoId)  where.cursoId = q.cursoId;
    if (q.unidade)  where.unidade = { contains: q.unidade, mode: 'insensitive' };
    if (q.validadeAte) where.validadeFim = { lte: new Date(q.validadeAte) };
    if (q.busca) {
      where.OR = [
        { pessoaNome:     { contains: q.busca, mode: 'insensitive' } },
        { pessoaCpf:      { contains: q.busca, mode: 'insensitive' } },
        { pessoaEmail:    { contains: q.busca, mode: 'insensitive' } },
        { pessoaTelefone: { contains: q.busca, mode: 'insensitive' } },
        { matriculaSfId:  { contains: q.busca, mode: 'insensitive' } },
      ];
    }

    const [total, itens] = await Promise.all([
      this.prisma.pedagogicoMatricula.count({ where }),
      this.prisma.pedagogicoMatricula.findMany({
        where,
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        orderBy: [{ criadoEm: 'desc' }],
        include: {
          turma: { select: { id: true, nome: true, cursoNome: true, dataInicio: true, dataFim: true, unidade: true, status: true } },
          credenciamento: { select: { criadoEm: true } },
          presencas: { select: { diaNume: true, sessao: true, status: true } },
          confirmacoes: {
            orderBy: { criadoEm: 'desc' },
            take: 1,
            select: { status: true, canal: true, criadoEm: true },
          },
        },
      }),
    ]);

    return {
      pagina, porPagina, total,
      itens: itens.map(m => this.formatarMatricula(m)),
    };
  }

  async buscarJornada(pessoaId: string) {
    const matriculas = await this.prisma.pedagogicoMatricula.findMany({
      where: { pessoaId },
      orderBy: [{ criadoEm: 'desc' }],
      include: {
        turma: { select: { id: true, nome: true, cursoNome: true, dataInicio: true, dataFim: true, unidade: true, status: true } },
        historico: { orderBy: { criadoEm: 'desc' }, take: 50 },
        confirmacoes: { orderBy: { criadoEm: 'desc' }, take: 20 },
        credenciamento: true,
        presencas: { orderBy: [{ diaNume: 'asc' }, { sessao: 'asc' }] },
        transferencias: {
          include: {
            turmaOrigem:  { select: { id: true, nome: true, dataInicio: true } },
            turmaDestino: { select: { id: true, nome: true, dataInicio: true } },
          },
          orderBy: { criadoEm: 'desc' },
        },
        solicitacoes: { orderBy: { criadoEm: 'desc' }, take: 20 },
        cs: { orderBy: { criadoEm: 'desc' }, take: 10 },
      },
    });

    return { pessoaId, total: matriculas.length, matriculas };
  }

  async criar(dto: CriarMatriculaDto, usuario: UsuarioLogado) {
    // Verificar se a turma existe
    const turma = await this.prisma.pedagogicoTurma.findUnique({ where: { id: dto.turmaId } });
    if (!turma) throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA', message: 'Turma não encontrada' });

    // Verificar se matrícula SF já existe (idempotência)
    if (dto.matriculaSfId) {
      const existente = await this.prisma.pedagogicoMatricula.findUnique({ where: { matriculaSfId: dto.matriculaSfId } });
      if (existente) return { id: existente.id, criado: false };
    }

    // Verificar se pessoa já está matriculada na mesma turma
    const duplicata = await this.prisma.pedagogicoMatricula.findFirst({
      where: { pessoaId: dto.pessoaId, turmaId: dto.turmaId, status: { notIn: ['Cancelado'] } },
    });
    if (duplicata) {
      throw new ConflictException({
        codigo: 'MATRICULA_DUPLICADA',
        message: 'Aluno já está matriculado nesta turma',
        matriculaId: duplicata.id,
      });
    }

    const matricula = await this.prisma.pedagogicoMatricula.create({
      data: {
        pessoaId:       dto.pessoaId,
        pessoaNome:     dto.pessoaNome ?? null,
        pessoaCpf:      dto.pessoaCpf ?? null,
        pessoaEmail:    dto.pessoaEmail ?? null,
        pessoaTelefone: dto.pessoaTelefone ?? null,
        turmaId:        dto.turmaId,
        matriculaSfId:  dto.matriculaSfId ?? null,
        vendaId:        dto.vendaId ?? null,
        cursoId:        dto.cursoId ?? null,
        cursoNome:      dto.cursoNome ?? turma.cursoNome,
        dataCompra:     dto.dataCompra     ? new Date(dto.dataCompra)     : null,
        dataMatricula:  dto.dataMatricula  ? new Date(dto.dataMatricula)  : new Date(),
        validadeInicio: dto.validadeInicio ? new Date(dto.validadeInicio) : null,
        validadeFim:    dto.validadeFim    ? new Date(dto.validadeFim)    : null,
        status:         dto.status ?? 'Matriculado',
        origem:         dto.origem ?? 'manual',
        unidade:        dto.unidade ?? turma.unidade ?? null,
        vendedor:       dto.vendedor ?? null,
        criadoPor:      usuario.id as unknown as string,
      },
    });

    // Registrar na timeline
    await this.registrarHistorico(matricula.id, 'matricula_criada', usuario.id,
      `Matrícula criada na turma "${turma.nome}"`, null, 'Matriculado', 'usuario');

    return { id: matricula.id, criado: true };
  }

  async atualizarStatus(id: string, dto: AtualizarStatusMatriculaDto, usuario: UsuarioLogado) {
    const matricula = await this.prisma.pedagogicoMatricula.findUnique({ where: { id } });
    if (!matricula) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });

    const statusAnterior = matricula.status;
    await this.prisma.pedagogicoMatricula.update({
      where: { id },
      data: { status: dto.status, atualizadoEm: new Date() },
    });

    await this.registrarHistorico(id, 'status_mudou', usuario.id,
      dto.observacao ?? null, statusAnterior, dto.status, 'usuario');

    return { id, status: dto.status };
  }

  /**
   * Remove (cancela) uma matrícula — soft-delete via status 'Cancelado'.
   * Preserva o histórico/timeline. Idempotente.
   */
  async remover(id: string, motivo: string | undefined, usuario: UsuarioLogado) {
    const matricula = await this.prisma.pedagogicoMatricula.findUnique({ where: { id } });
    if (!matricula) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });

    if (matricula.status === 'Cancelado') {
      return { id, status: 'Cancelado', jaCancelada: true };
    }

    const statusAnterior = matricula.status;
    await this.prisma.pedagogicoMatricula.update({
      where: { id },
      data: { status: 'Cancelado', atualizadoEm: new Date() },
    });

    await this.registrarHistorico(id, 'cancelamento', usuario.id,
      motivo ?? 'Matrícula cancelada', statusAnterior, 'Cancelado', 'usuario');

    return { id, status: 'Cancelado' };
  }

  /** Integração Salesforce: VENDA_APROVADA → cria ou atualiza matrícula de forma idempotente */
  async integrarVenda(dto: IntegrarVendaDto, usuario: UsuarioLogado) {
    // Log de integração (idempotência via UNIQUE)
    const logKey = { sistemaOrigem: 'salesforce', evento: 'VENDA_APROVADA', idExterno: dto.vendaId };
    const logExistente = await this.prisma.pedagogicoIntegracaoLog.findUnique({ where: { sistemaOrigem_evento_idExterno: logKey } });
    if (logExistente?.resultado === 'ok') {
      return {
        operacao: 'ignorado',
        motivo: 'venda_ja_processada',
        matriculaId: logExistente.matriculaId,
        logId: Number(logExistente.id),
      };
    }

    let log = logExistente ?? await this.prisma.pedagogicoIntegracaoLog.create({
      data: { ...logKey, payload: dto as unknown as Prisma.InputJsonValue },
    });

    try {
      // Buscar/criar turma se turmaId Salesforce informado
      let turmaId: string | null = null;
      if (dto.turmaId) {
        const turmaExistente = await this.prisma.pedagogicoTurma.findFirst({
          where: { OR: [{ id: dto.turmaId }, { turmaIdSf: dto.turmaId }, { dimTurmaId: dto.turmaId }] },
        });
        if (turmaExistente) {
          turmaId = turmaExistente.id;
        } else {
          // Criar turma genérica (Turma A Definir)
          const novaT = await this.prisma.pedagogicoTurma.create({
            data: {
              nome:      `Turma ${dto.turmaId}`,
              cursoNome: dto.cursoNome ?? 'Curso a identificar',
              turmaIdSf: dto.turmaId,
              status:    'Planejada',
              cursoId:   dto.cursoId ?? null,
              criadoPor: usuario.id as unknown as string,
            },
          });
          turmaId = novaT.id;
        }
      } else {
        // Turma A Definir: buscar/criar turma-placeholder por curso
        const placeholder = await this.prisma.pedagogicoTurma.findFirst({
          where: { cursoId: dto.cursoId ?? '', nome: { contains: 'A DEFINIR' } },
        });
        if (placeholder) {
          turmaId = placeholder.id;
        } else {
          const novaT = await this.prisma.pedagogicoTurma.create({
            data: {
              nome:      `${dto.cursoNome ?? 'Curso'} — TURMA A DEFINIR`,
              cursoNome: dto.cursoNome ?? 'A identificar',
              cursoId:   dto.cursoId ?? null,
              status:    'Aguardando Validação',
              criadoPor: usuario.id as unknown as string,
            },
          });
          turmaId = novaT.id;
        }
      }

      // Verificar se matrícula já existe
      const matExistente = await this.prisma.pedagogicoMatricula.findUnique({ where: { matriculaSfId: dto.vendaId } });
      let matriculaId: string;
      let operacao: string;

      if (matExistente) {
        matriculaId = matExistente.id;
        operacao = 'atualizado';
      } else {
        const mat = await this.prisma.pedagogicoMatricula.create({
          data: {
            pessoaId:       dto.alunoId,
            pessoaNome:     dto.alunoNome ?? null,
            pessoaCpf:      dto.alunoCpf ?? null,
            pessoaEmail:    dto.alunoEmail ?? null,
            pessoaTelefone: dto.alunoTelefone ?? null,
            turmaId:        turmaId!,
            matriculaSfId:  dto.vendaId,
            vendaId:        dto.vendaId,
            cursoId:        dto.cursoId ?? null,
            cursoNome:      dto.cursoNome ?? null,
            dataCompra:     dto.dataCompra ? new Date(dto.dataCompra) : null,
            status:         'Matriculado',
            origem:         'salesforce',
            unidade:        dto.unidade ?? null,
            vendedor:       dto.vendedor ?? null,
            criadoPor:      usuario.id as unknown as string,
          },
        });
        matriculaId = mat.id;
        operacao = 'criado';
        await this.registrarHistorico(matriculaId, 'venda_aprovada', usuario.id,
          `Venda aprovada via Salesforce (${dto.vendaId})`, null, 'Matriculado', 'integracao');
      }

      // Marcar log como OK
      await this.prisma.pedagogicoIntegracaoLog.update({
        where: { id: log.id },
        data: { resultado: 'ok', matriculaId, turmaId: turmaId ?? undefined, processadoEm: new Date() },
      });

      return { operacao, matriculaId, turmaId, logId: Number(log.id) };

    } catch (erro) {
      await this.prisma.pedagogicoIntegracaoLog.update({
        where: { id: log.id },
        data: { resultado: 'erro', erroMsg: String(erro).slice(0, 1000), tentativas: { increment: 1 } },
      }).catch(() => undefined);
      throw erro;
    }
  }

  async registrarHistorico(
    matriculaId: string,
    tipo: string,
    usuarioId: string | null,
    descricao: string | null,
    valorAnterior: string | null,
    valorNovo: string | null,
    origem: string = 'sistema',
  ) {
    return this.prisma.pedagogicoMatriculaHistorico.create({
      data: {
        matriculaId,
        tipo,
        descricao,
        valorAnterior,
        valorNovo,
        usuarioId: usuarioId as unknown as string | null,
        origem,
      },
    });
  }

  async buscarPorId(id: string) {
    const m = await this.prisma.pedagogicoMatricula.findUnique({
      where: { id },
      include: {
        turma: true,
        historico: { orderBy: { criadoEm: 'desc' }, take: 100 },
        confirmacoes: { orderBy: { criadoEm: 'desc' } },
        credenciamento: true,
        presencas: { orderBy: [{ diaNume: 'asc' }, { sessao: 'asc' }] },
        transferencias: {
          include: {
            turmaOrigem:  { select: { id: true, nome: true, dataInicio: true } },
            turmaDestino: { select: { id: true, nome: true, dataInicio: true } },
          },
          orderBy: { criadoEm: 'desc' },
        },
        solicitacoes: { orderBy: { criadoEm: 'desc' } },
        cs: { orderBy: { criadoEm: 'desc' } },
      },
    });
    if (!m) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });
    return m;
  }

  private formatarMatricula(m: any) {
    return {
      id:             m.id,
      pessoaId:       m.pessoaId,
      pessoaNome:     m.pessoaNome,
      pessoaCpf:      m.pessoaCpf,
      pessoaEmail:    m.pessoaEmail,
      pessoaTelefone: m.pessoaTelefone,
      status:         m.status,
      dataCompra:     m.dataCompra?.toISOString().slice(0, 10)   ?? null,
      dataMatricula:  m.dataMatricula?.toISOString().slice(0, 10) ?? null,
      validadeFim:    m.validadeFim?.toISOString().slice(0, 10)  ?? null,
      origem:         m.origem,
      cursoNome:      m.cursoNome,
      unidade:        m.unidade,
      criadoEm:       m.criadoEm?.toISOString() ?? null,
      turma: m.turma ? {
        id: m.turma.id, nome: m.turma.nome, cursoNome: m.turma.cursoNome,
        dataInicio: m.turma.dataInicio?.toISOString().slice(0, 10) ?? null,
        dataFim:    m.turma.dataFim?.toISOString().slice(0, 10)    ?? null,
        unidade: m.turma.unidade, status: m.turma.status,
      } : null,
      credenciado:       !!m.credenciamento,
      credenciadoEm:     m.credenciamento?.criadoEm?.toISOString() ?? null,
      totalPresencas:    m.presencas?.length ?? 0,
      ultimaConfirmacao: m.confirmacoes?.[0] ?? null,
    };
  }
}
