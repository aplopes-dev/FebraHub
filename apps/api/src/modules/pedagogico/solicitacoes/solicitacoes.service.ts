import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import { CriarSolicitacaoDto } from '../dto/operacional.dto';

@Injectable()
export class SolicitacoesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { status?: string; tipo?: string; pessoaId?: string }) {
    const where: any = {};
    if (filtros.status)   where.status   = filtros.status;
    if (filtros.tipo)     where.tipo     = filtros.tipo;
    if (filtros.pessoaId) where.pessoaId = filtros.pessoaId;
    return this.prisma.pedagogicoSolicitacao.findMany({
      where,
      orderBy: [{ prioridade: 'asc' }, { criadoEm: 'desc' }],
      include: {
        matricula: { select: { id: true, pessoaNome: true, cursoNome: true } },
      },
    });
  }

  async criar(dto: CriarSolicitacaoDto, usuario: UsuarioLogado) {
    return this.prisma.pedagogicoSolicitacao.create({
      data: {
        tipo:         dto.tipo,
        pessoaId:     dto.pessoaId,
        matriculaId:  dto.matriculaId ?? null,
        descricao:    dto.descricao ?? null,
        prioridade:   dto.prioridade ?? 'normal',
        prazo:        dto.prazo ? new Date(dto.prazo) : null,
        status:       'aberta',
        criadoPor:    usuario.id as unknown as string,
      },
    });
  }

  async atualizarStatus(id: string, status: string, resposta: string | undefined, usuario: UsuarioLogado) {
    const sol = await this.prisma.pedagogicoSolicitacao.findUnique({ where: { id } });
    if (!sol) throw new NotFoundException({ codigo: 'SOLICITACAO_NAO_ENCONTRADA', message: 'Solicitação não encontrada' });
    return this.prisma.pedagogicoSolicitacao.update({
      where: { id },
      data: {
        status,
        resposta:      resposta ?? null,
        responsavelId: usuario.id as unknown as string,
        resolvidoEm:   status === 'concluida' ? new Date() : null,
        atualizadoEm:  new Date(),
      },
    });
  }

  /** Remove uma solicitação (hard delete — registro leve, sem dependências). */
  async remover(id: string, usuario: UsuarioLogado) {
    const sol = await this.prisma.pedagogicoSolicitacao.findUnique({ where: { id } });
    if (!sol) throw new NotFoundException({ codigo: 'SOLICITACAO_NAO_ENCONTRADA', message: 'Solicitação não encontrada' });
    await this.prisma.pedagogicoSolicitacao.delete({ where: { id } });
    return { ok: true, id };
  }
}
