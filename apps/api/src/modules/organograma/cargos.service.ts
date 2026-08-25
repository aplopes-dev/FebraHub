import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AtualizarCargoDto, CriarCargoDto } from './cargos.dto';

/**
 * CRUD de cargos do organograma. O cargo é a entidade normalizada por trás do
 * antigo texto livre `funcao`. Regras de integridade impostas aqui (o banco
 * garante unicidade e SET NULL, mas as mensagens amigáveis nascem daqui):
 *  - UNIQUE (setor, nome): não duplica cargo no mesmo setor.
 *  - cargoPai precisa existir, ser do mesmo setor e não formar ciclo.
 *  - excluir cargo com membros/subordinados é bloqueado (evita orfãos silenciosos).
 */
@Injectable()
export class CargosService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.orgCargo.findMany({
      orderBy: [{ setor: 'asc' }, { nivel: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { membros: true, subordinados: true } } },
    });
  }

  async criar(dto: CriarCargoDto) {
    await this.validarPai(dto.cargoPaiId ?? null, dto.setor, null);
    try {
      return await this.prisma.orgCargo.create({
        data: {
          nome: dto.nome,
          setor: dto.setor,
          nivel: dto.nivel ?? 0,
          descricao: dto.descricao ?? null,
          cargoPaiId: dto.cargoPaiId ?? null,
        },
      });
    } catch (e) {
      throw this.traduzirErro(e);
    }
  }

  async atualizar(id: string, dto: AtualizarCargoDto) {
    const atual = await this.prisma.orgCargo.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Cargo não encontrado.');

    const setorFinal = dto.setor ?? atual.setor;

    if (dto.cargoPaiId !== undefined) {
      await this.validarPai(dto.cargoPaiId, setorFinal, id);
    } else if (dto.setor && dto.setor !== atual.setor && atual.cargoPaiId) {
      // trocou de setor mantendo pai antigo (de outro setor) → inválido
      await this.validarPai(atual.cargoPaiId, setorFinal, id);
    }

    try {
      return await this.prisma.orgCargo.update({
        where: { id },
        data: {
          ...(dto.nome !== undefined ? { nome: dto.nome } : {}),
          ...(dto.setor !== undefined ? { setor: dto.setor } : {}),
          ...(dto.nivel !== undefined ? { nivel: dto.nivel } : {}),
          ...(dto.descricao !== undefined ? { descricao: dto.descricao } : {}),
          ...(dto.cargoPaiId !== undefined ? { cargoPaiId: dto.cargoPaiId } : {}),
          ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
          atualizadoEm: new Date(),
        },
      });
    } catch (e) {
      throw this.traduzirErro(e);
    }
  }

  async excluir(id: string) {
    const alvo = await this.prisma.orgCargo.findUnique({
      where: { id },
      include: { _count: { select: { membros: true, subordinados: true } } },
    });
    if (!alvo) throw new NotFoundException('Cargo não encontrado.');
    if (alvo._count.membros > 0) {
      throw new ConflictException(
        `Há ${alvo._count.membros} membro(s) neste cargo. Reatribua-os antes de excluir.`,
      );
    }
    if (alvo._count.subordinados > 0) {
      throw new ConflictException(
        `Há ${alvo._count.subordinados} cargo(s) subordinado(s) a este. Remova o vínculo antes de excluir.`,
      );
    }
    await this.prisma.orgCargo.delete({ where: { id } });
    return { ok: true };
  }

  /** Pai precisa existir, ser do mesmo setor, não ser o próprio cargo e não
   *  criar ciclo (A→B→A). `idAtual` é null na criação. */
  private async validarPai(paiId: string | null, setor: string, idAtual: string | null) {
    if (!paiId) return;
    if (paiId === idAtual) {
      throw new BadRequestException('Um cargo não pode se reportar a si mesmo.');
    }
    const pai = await this.prisma.orgCargo.findUnique({ where: { id: paiId } });
    if (!pai) throw new BadRequestException('Cargo superior não encontrado.');
    if (pai.setor !== setor) {
      throw new BadRequestException('O cargo superior deve ser do mesmo setor.');
    }
    // Detecta ciclo: sobe pela cadeia do pai; se topar com idAtual, é ciclo.
    if (idAtual) {
      let cursor: string | null = pai.cargoPaiId;
      const visitados = new Set<string>([paiId]);
      while (cursor) {
        if (cursor === idAtual) {
          throw new BadRequestException('Hierarquia inválida: isso criaria um ciclo.');
        }
        if (visitados.has(cursor)) break;
        visitados.add(cursor);
        const acima: { cargoPaiId: string | null } | null =
          await this.prisma.orgCargo.findUnique({
            where: { id: cursor },
            select: { cargoPaiId: true },
          });
        cursor = acima?.cargoPaiId ?? null;
      }
    }
  }

  private traduzirErro(e: unknown): Error {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
      return new ConflictException('Já existe um cargo com esse nome neste setor.');
    }
    return e as Error;
  }
}
