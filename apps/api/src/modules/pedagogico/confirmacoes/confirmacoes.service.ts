import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { UsuarioLogado } from '../../../common/decorators/usuario.decorator';
import { RegistrarConfirmacaoDto } from '../dto/operacional.dto';
import { MatriculasService } from '../matriculas/matriculas.service';

@Injectable()
export class ConfirmacoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly matriculas: MatriculasService,
  ) {}

  async listar(filtros: { matriculaId?: string; status?: string }) {
    const where: any = {};
    if (filtros.matriculaId) where.matriculaId = filtros.matriculaId;
    if (filtros.status)      where.status = filtros.status;

    return this.prisma.pedagogicoConfirmacao.findMany({
      where,
      orderBy: { criadoEm: 'desc' },
      take: 200,
    });
  }

  async registrar(dto: RegistrarConfirmacaoDto, usuario: UsuarioLogado) {
    const matricula = await this.prisma.pedagogicoMatricula.findUnique({ where: { id: dto.matriculaId } });
    if (!matricula) throw new NotFoundException({ codigo: 'MATRICULA_NAO_ENCONTRADA', message: 'Matrícula não encontrada' });

    // Contar tentativas anteriores
    const tentativas = await this.prisma.pedagogicoConfirmacao.count({ where: { matriculaId: dto.matriculaId } });

    const confirmacao = await this.prisma.pedagogicoConfirmacao.create({
      data: {
        matriculaId:   dto.matriculaId,
        canal:         dto.canal ?? 'whatsapp',
        status:        dto.status ?? 'enviado',
        mensagem:      dto.mensagem ?? null,
        templateTipo:  dto.templateTipo ?? null,
        usuarioId:     usuario.id as unknown as string,
        resposta:      dto.resposta ?? null,
        tentativaNum:  dto.tentativaNum ?? tentativas + 1,
      },
    });

    // Se status é confirmado, atualiza status da matrícula
    if (dto.status === 'confirmado') {
      await this.prisma.pedagogicoMatricula.update({
        where: { id: dto.matriculaId },
        data: { status: 'Confirmado', atualizadoEm: new Date() },
      });
      await this.matriculas.registrarHistorico(
        dto.matriculaId, 'confirmado', usuario.id,
        `Confirmação registrada via ${dto.canal ?? 'whatsapp'}`,
        matricula.status, 'Confirmado', 'usuario',
      );
    } else if (dto.status === 'nao_respondeu' && matricula.status === 'Aguardando Resposta') {
      await this.prisma.pedagogicoMatricula.update({
        where: { id: dto.matriculaId },
        data: { status: 'Não Respondeu', atualizadoEm: new Date() },
      });
    }

    // Registrar na timeline
    await this.matriculas.registrarHistorico(
      dto.matriculaId, 'contato_registrado', usuario.id,
      `Contato ${dto.canal ?? 'whatsapp'} — ${dto.status ?? 'enviado'} (tentativa ${tentativas + 1})`,
      null, null, 'usuario',
    );

    return confirmacao;
  }

  async atualizarStatus(id: string, status: string, resposta: string | undefined, usuario: UsuarioLogado) {
    const conf = await this.prisma.pedagogicoConfirmacao.findUnique({ where: { id } });
    if (!conf) throw new NotFoundException({ codigo: 'CONFIRMACAO_NAO_ENCONTRADA', message: 'Confirmação não encontrada' });

    const atualizado = await this.prisma.pedagogicoConfirmacao.update({
      where: { id },
      data: {
        status,
        resposta:      resposta ?? null,
        respondidoEm:  ['confirmado', 'respondido', 'nao_respondeu'].includes(status) ? new Date() : undefined,
      },
    });

    // Se confirmou, propaga para matrícula
    if (status === 'confirmado') {
      await this.prisma.pedagogicoMatricula.update({
        where: { id: conf.matriculaId },
        data:  { status: 'Confirmado', atualizadoEm: new Date() },
      });
      await this.matriculas.registrarHistorico(
        conf.matriculaId, 'confirmado', usuario.id,
        'Aluno confirmou participação', null, 'Confirmado', 'usuario',
      );
    }

    return atualizado;
  }
}
