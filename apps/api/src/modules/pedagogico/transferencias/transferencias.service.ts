import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import { EfetivarTransferenciaDto, SolicitarTransferenciaDto } from '../dto/operacional.dto';
import { MatriculasService } from '../matriculas/matriculas.service';

@Injectable()
export class TransferenciasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matriculas: MatriculasService,
  ) {}

  async solicitar(dto: SolicitarTransferenciaDto, usuario: UsuarioLogado) {
    const matricula = await this.prisma.pedagogicoMatricula.findUnique({ where: { id: dto.matriculaId } });
    if (!matricula) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });

    if (['Cancelado', 'Concluído'].includes(matricula.status)) {
      throw new BadRequestException({ codigo: 'STATUS_INVALIDO', message: `Não é possível transferir uma matrícula com status "${matricula.status}"` });
    }

    // Verificar política de transferência
    const politica = await this.prisma.pedagogicoPolitica.findFirst({
      where: { cursoId: matricula.cursoId ?? '', ativo: true },
    });

    if (politica && !politica.permiteTransferencia) {
      throw new BadRequestException({ codigo: 'TRANSFERENCIA_NAO_PERMITIDA', message: 'Política do curso não permite transferência' });
    }

    // Verificar limite de transferências
    if (politica?.maxTransferencias) {
      const total = await this.prisma.pedagogicoTransferencia.count({
        where: { matriculaId: dto.matriculaId, status: { in: ['aprovada', 'efetivada'] } },
      });
      if (total >= Number(politica.maxTransferencias)) {
        throw new BadRequestException({
          codigo: 'LIMITE_TRANSFERENCIAS',
          message: `Limite de ${politica.maxTransferencias} transferências atingido`,
        });
      }
    }

    const transf = await this.prisma.pedagogicoTransferencia.create({
      data: {
        matriculaId:     dto.matriculaId,
        turmaOrigemId:   dto.turmaOrigemId,
        turmaDestinoId:  dto.turmaDestinoId ?? null,
        motivo:          dto.motivo ?? null,
        observacoes:     dto.observacoes ?? null,
        status:          'solicitada',
        taxaCobrada:     false,
        usuarioId:       usuario.id as unknown as string,
      },
    });

    // Atualizar status da matrícula
    await this.prisma.pedagogicoMatricula.update({
      where: { id: dto.matriculaId },
      data:  { status: 'Transferência Solicitada', atualizadoEm: new Date() },
    });

    await this.matriculas.registrarHistorico(
      dto.matriculaId, 'transferencia', usuario.id,
      `Transferência solicitada — motivo: ${dto.motivo ?? 'não informado'}`,
      matricula.status, 'Transferência Solicitada', 'usuario',
    );

    return transf;
  }

  async efetivar(id: string, dto: EfetivarTransferenciaDto, usuario: UsuarioLogado) {
    const transf = await this.prisma.pedagogicoTransferencia.findUnique({ where: { id } });
    if (!transf) throw new NotFoundException({ codigo: 'TRANSFERENCIA_NAO_ENCONTRADA', message: 'Transferência não encontrada' });

    if (!['solicitada', 'aprovada'].includes(transf.status)) {
      throw new BadRequestException({ codigo: 'STATUS_INVALIDO', message: `Transferência não pode ser efetivada no status atual: ${transf.status}` });
    }

    const turmaDestino = await this.prisma.pedagogicoTurma.findUnique({ where: { id: dto.turmaDestinoId } });
    if (!turmaDestino) throw new NotFoundException({ codigo: 'TURMA_NAO_ENCONTRADA', message: 'Turma de destino não encontrada' });

    // Verificar capacidade
    if (turmaDestino.capacidade) {
      const matriculados = await this.prisma.pedagogicoMatricula.count({
        where: { turmaId: dto.turmaDestinoId, status: { notIn: ['Cancelado'] } },
      });
      if (matriculados >= turmaDestino.capacidade) {
        throw new BadRequestException({ codigo: 'TURMA_LOTADA', message: 'Turma de destino atingiu a capacidade máxima' });
      }
    }

    // Efetivar: muda turmaId na matrícula + registra transferência
    // NUNCA sobrescreve histórico — a coluna turmaId aponta para a turma atual
    await Promise.all([
      this.prisma.pedagogicoMatricula.update({
        where: { id: transf.matriculaId },
        data: {
          turmaId:      dto.turmaDestinoId,
          status:       'Transferido',
          atualizadoEm: new Date(),
        },
      }),
      this.prisma.pedagogicoTransferencia.update({
        where: { id },
        data: {
          turmaDestinoId: dto.turmaDestinoId,
          status:         'efetivada',
          aprovadoPor:    usuario.id as unknown as string,
          atualizadoEm:   new Date(),
        },
      }),
    ]);

    await this.matriculas.registrarHistorico(
      transf.matriculaId, 'transferencia', usuario.id,
      `Transferência efetivada para turma "${turmaDestino.nome}"`,
      'Transferência Solicitada', 'Transferido', 'usuario',
    );

    return { ok: true, turmaDestinoNome: turmaDestino.nome };
  }

  async cancelar(id: string, usuario: UsuarioLogado) {
    const transf = await this.prisma.pedagogicoTransferencia.findUnique({ where: { id } });
    if (!transf) throw new NotFoundException({ codigo: 'TRANSFERENCIA_NAO_ENCONTRADA', message: 'Transferência não encontrada' });
    if (transf.status === 'efetivada') {
      throw new BadRequestException({ codigo: 'JA_EFETIVADA', message: 'Não é possível cancelar uma transferência já efetivada' });
    }

    await this.prisma.pedagogicoTransferencia.update({
      where: { id },
      data: { status: 'cancelada', atualizadoEm: new Date() },
    });

    // Reverter status da matrícula
    await this.prisma.pedagogicoMatricula.update({
      where: { id: transf.matriculaId },
      data: { status: 'Matriculado', atualizadoEm: new Date() },
    });

    return { ok: true };
  }
}
