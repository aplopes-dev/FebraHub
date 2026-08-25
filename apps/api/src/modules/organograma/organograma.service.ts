import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { AtualizarMembroDto, CriarMembroDto } from './organograma.dto';

/**
 * CRUD sobre org_membros. O grafo em si é montado no front, que conhece o
 * desenho (anéis, cores por setor). Aqui garantimos ordem estável (setor →
 * ordem → nome) e a coerência com a entidade Cargo: quando o membro vem com
 * `cargoId`, a `funcao` (texto legado) e o `setor` passam a espelhar o cargo.
 */
@Injectable()
export class OrganogramaService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.orgMembro.findMany({
      where: { ativo: true },
      orderBy: [{ setor: 'asc' }, { ordem: 'asc' }, { nome: 'asc' }],
      include: { cargo: { select: { id: true, nome: true, setor: true, nivel: true } } },
    });
  }

  async criar(dto: CriarMembroDto) {
    const { funcao, setor } = await this.resolverCargo(dto.cargoId ?? null, dto.funcao, dto.setor);
    return this.prisma.orgMembro.create({
      data: {
        tipo: dto.tipo,
        nome: dto.nome,
        funcao,
        setor,
        cargoId: dto.cargoId ?? null,
        ordem: dto.ordem ?? 0,
      },
      include: { cargo: { select: { id: true, nome: true, setor: true, nivel: true } } },
    });
  }

  async atualizar(id: string, dto: AtualizarMembroDto) {
    const existente = await this.prisma.orgMembro.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Membro não encontrado.');

    const dados: Record<string, unknown> = {
      ...(dto.tipo !== undefined ? { tipo: dto.tipo } : {}),
      ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
      ...(dto.ordem !== undefined ? { ordem: dto.ordem } : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      atualizadoEm: new Date(),
    };

    // Se mexeu em cargo/função/setor, reconcilia os três.
    if (dto.cargoId !== undefined || dto.funcao !== undefined || dto.setor !== undefined) {
      const cargoAlvo = dto.cargoId !== undefined ? dto.cargoId : existente.cargoId;
      const { funcao, setor } = await this.resolverCargo(
        cargoAlvo,
        dto.funcao ?? existente.funcao,
        dto.setor ?? existente.setor,
      );
      dados.cargoId = cargoAlvo;
      dados.funcao = funcao;
      dados.setor = setor;
    }

    return this.prisma.orgMembro.update({
      where: { id },
      data: dados,
      include: { cargo: { select: { id: true, nome: true, setor: true, nivel: true } } },
    });
  }

  /** Exclusão real (não soft): o organograma é cadastro vivo, sem histórico
   *  a preservar — quem saiu, saiu. `ativo` existe para rascunho/pausa. */
  async excluir(id: string) {
    const existente = await this.prisma.orgMembro.findUnique({ where: { id } });
    if (!existente) throw new NotFoundException('Membro não encontrado.');
    await this.prisma.orgMembro.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Reconcilia cargo × função × setor:
   *  - com cargoId: o cargo manda — funcao = cargo.nome, setor = cargo.setor.
   *  - sem cargoId: exige funcao textual (fallback legado) e usa o setor dado.
   */
  private async resolverCargo(
    cargoId: string | null,
    funcao: string | undefined,
    setor: string,
  ): Promise<{ funcao: string; setor: string }> {
    if (cargoId) {
      const cargo = await this.prisma.orgCargo.findUnique({ where: { id: cargoId } });
      if (!cargo) throw new BadRequestException('Cargo não encontrado.');
      return { funcao: cargo.nome, setor: cargo.setor };
    }
    const texto = (funcao ?? '').trim();
    if (texto.length < 2) {
      throw new BadRequestException('Informe um cargo ou uma função (mínimo 2 caracteres).');
    }
    return { funcao: texto, setor };
  }
}
