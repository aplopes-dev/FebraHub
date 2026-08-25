import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import { CriarMonitorDto, EscalarMonitorDto } from '../dto/operacional.dto';

@Injectable()
export class MonitoresService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: { status?: string; busca?: string }) {
    const where: any = {};
    if (filtros.status) where.status = filtros.status;
    if (filtros.busca) {
      where.OR = [
        { nome:     { contains: filtros.busca, mode: 'insensitive' } },
        { email:    { contains: filtros.busca, mode: 'insensitive' } },
        { telefone: { contains: filtros.busca, mode: 'insensitive' } },
      ];
    }
    return this.prisma.pedagogicoMonitor.findMany({
      where,
      orderBy: { nome: 'asc' },
      include: {
        escalas: {
          include: { turma: { select: { id: true, nome: true, dataInicio: true, status: true } } },
        },
      },
    });
  }

  async criar(dto: CriarMonitorDto, usuario: UsuarioLogado) {
    return this.prisma.pedagogicoMonitor.create({
      data: {
        pessoaId:          dto.pessoaId,
        nome:              dto.nome,
        usuarioId:         dto.usuarioId ?? null,
        email:             dto.email ?? null,
        telefone:          dto.telefone ?? null,
        cursosHabilitados: dto.cursosHabilitados ?? [],
        observacoes:       dto.observacoes ?? null,
        status:            'ativo',
      },
    });
  }

  async escalar(dto: EscalarMonitorDto, usuario: UsuarioLogado) {
    // Verificar turma e monitor
    const [turma, monitor] = await Promise.all([
      this.prisma.pedagogicoTurma.findUnique({ where: { id: dto.turmaId } }),
      this.prisma.pedagogicoMonitor.findUnique({ where: { id: dto.monitorId } }),
    ]);
    if (!turma)   throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA',   message: 'Turma não encontrada' });
    if (!monitor) throw new NotFoundException({ codigo: 'MONITOR_NAO_ENCONTRADO', message: 'Monitor não encontrado' });

    return this.prisma.pedagogicoEscala.upsert({
      where: { turmaId_monitorId: { turmaId: dto.turmaId, monitorId: dto.monitorId } },
      create: {
        turmaId:     dto.turmaId,
        monitorId:   dto.monitorId,
        funcao:      dto.funcao ?? 'monitor',
        dataInicio:  dto.dataInicio  ? new Date(dto.dataInicio)  : null,
        dataFim:     dto.dataFim     ? new Date(dto.dataFim)     : null,
        horario:     dto.horario ?? null,
        observacoes: dto.observacoes ?? null,
      },
      update: {
        funcao:      dto.funcao ?? 'monitor',
        dataInicio:  dto.dataInicio  ? new Date(dto.dataInicio)  : null,
        dataFim:     dto.dataFim     ? new Date(dto.dataFim)     : null,
        horario:     dto.horario ?? null,
        observacoes: dto.observacoes ?? null,
      },
    });
  }

  async marcarKitEntregue(escalaId: string, usuario: UsuarioLogado) {
    const escala = await this.prisma.pedagogicoEscala.findUnique({ where: { id: escalaId } });
    if (!escala) throw new NotFoundException({ codigo: 'ESCALA_NAO_ENCONTRADA', message: 'Escala não encontrada' });
    return this.prisma.pedagogicoEscala.update({
      where: { id: escalaId },
      data:  { kitEntregue: true },
    });
  }

  /**
   * Remove (inativa) um monitor — soft-delete via status 'inativo'.
   * As escalas são preservadas (histórico da turma). Idempotente.
   */
  async remover(id: string, usuario: UsuarioLogado) {
    const monitor = await this.prisma.pedagogicoMonitor.findUnique({ where: { id } });
    if (!monitor) throw new NotFoundException({ codigo: 'MONITOR_NAO_ENCONTRADO', message: 'Monitor não encontrado' });
    if (monitor.status === 'inativo') return { id, status: 'inativo', jaInativo: true };

    await this.prisma.pedagogicoMonitor.update({
      where: { id },
      data:  { status: 'inativo', atualizadoEm: new Date() },
    });
    return { id, status: 'inativo' };
  }

  /** Remove uma escala de monitor de uma turma (hard delete — é só um vínculo). */
  async removerEscala(escalaId: string, usuario: UsuarioLogado) {
    const escala = await this.prisma.pedagogicoEscala.findUnique({ where: { id: escalaId } });
    if (!escala) throw new NotFoundException({ codigo: 'ESCALA_NAO_ENCONTRADA', message: 'Escala não encontrada' });
    await this.prisma.pedagogicoEscala.delete({ where: { id: escalaId } });
    return { ok: true, id: escalaId };
  }
}
