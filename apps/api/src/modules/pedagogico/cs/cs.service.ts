import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';

@Injectable()
export class CsService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { status?: string; motivo?: string; responsavelId?: string }) {
    const where: any = {};
    if (filtros.status)        where.status        = filtros.status;
    if (filtros.motivo)        where.motivo        = filtros.motivo;
    if (filtros.responsavelId) where.responsavelId = filtros.responsavelId;

    return this.prisma.pedagogicoCsAcompanhamento.findMany({
      where,
      orderBy: [{ prioridade: 'asc' }, { prazo: 'asc' }, { criadoEm: 'desc' }],
      include: {
        matricula: {
          select: {
            id: true, pessoaNome: true, cursoNome: true, validadeFim: true, status: true,
            turma: { select: { id: true, nome: true, dataInicio: true } },
          },
        },
      },
    });
  }

  async criar(data: {
    matriculaId?: string | null;
    pessoaId: string;
    pessoaNome?: string | null;
    motivo: string;
    prioridade?: string | null;
    proxima_acao?: string | null;
    prazo?: string | null;
    observacoes?: string | null;
    responsavelId?: string | null;
  }, usuario: UsuarioLogado) {
    return this.prisma.pedagogicoCsAcompanhamento.create({
      data: {
        matriculaId:   data.matriculaId ?? null,
        pessoaId:      data.pessoaId,
        pessoaNome:    data.pessoaNome ?? null,
        motivo:        data.motivo,
        prioridade:    data.prioridade ?? 'normal',
        status:        'aberto',
        responsavelId: data.responsavelId ?? null,
        proximaAcao:   data.proxima_acao ?? null,
        prazo:         data.prazo ? new Date(data.prazo) : null,
        observacoes:   data.observacoes ?? null,
      },
    });
  }

  async atualizar(id: string, data: any, usuario: UsuarioLogado) {
    const cs = await this.prisma.pedagogicoCsAcompanhamento.findUnique({ where: { id } });
    if (!cs) throw new NotFoundException({ codigo: 'CS_NAO_ENCONTRADO', message: 'Acompanhamento não encontrado' });

    return this.prisma.pedagogicoCsAcompanhamento.update({
      where: { id },
      data: {
        status:        data.status        ?? undefined,
        prioridade:    data.prioridade    ?? undefined,
        responsavelId: data.responsavelId ?? undefined,
        proximaAcao:   data.proxima_acao  ?? undefined,
        prazo:         data.prazo ? new Date(data.prazo) : undefined,
        observacoes:   data.observacoes   ?? undefined,
        resultado:     data.resultado     ?? undefined,
        resolvidoEm:   data.status === 'resolvido' ? new Date() : undefined,
        atualizadoEm:  new Date(),
      },
    });
  }
}
