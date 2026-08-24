import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  CostCenter,
  type CostCenterProps,
} from '../../domain/entities/cost-center.entity';
import {
  CostCenterRepository,
  type CostCenterListCriteria,
  type CostCenterTabCounts,
} from '../../domain/repositories/cost-center.repository.interface';

type CostCenterRow = {
  id: string;
  organizationId: string;
  name: string;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaCostCenterRepository extends CostCenterRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<CostCenter | null> {
    // Inclui os excluídos de propósito: a aba "Excluídos" da listagem leva até
    // o detalhe deles, e restaurar precisa encontrá-los.
    const row = await this.prisma.scoped.costCenter.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<CostCenter | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    // Inclui os excluídos de propósito: o unique do banco
    // (`organizationId, name`) não conhece soft-delete. Filtrar aqui faria a
    // checagem passar e o INSERT estourar como 500 — o cliente deve restaurar.
    const row = await this.prisma.scoped.costCenter.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: CostCenterListCriteria = {},
  ): Promise<CostCenter[]> {
    const rows = await this.prisma.scoped.costCenter.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Omit<CostCenterListCriteria, 'skip' | 'take'> = {},
  ): Promise<number> {
    return this.prisma.scoped.costCenter.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<CostCenterTabCounts> {
    const [active, deleted] = await Promise.all([
      this.prisma.scoped.costCenter.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.costCenter.count({
        where: { organizationId, deletedAt: { not: null } },
      }),
    ]);
    return { active, deleted };
  }

  async save(costCenter: CostCenter): Promise<CostCenter> {
    const data = {
      organizationId: costCenter.organizationId,
      name: costCenter.name,
      deletedAt: costCenter.deletedAt,
      updatedAt: costCenter.updatedAt,
    };

    const row = await this.prisma.scoped.costCenter.upsert({
      where: { id: costCenter.id },
      create: { id: costCenter.id, ...data, createdAt: costCenter.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  async softDelete(
    organizationId: string,
    id: string,
    deletedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.costCenter.updateMany({
      where: { id, organizationId },
      data: { deletedAt, updatedAt: deletedAt },
    });
  }

  async clearDeletedAt(
    organizationId: string,
    id: string,
    updatedAt: Date,
  ): Promise<void> {
    await this.prisma.scoped.costCenter.updateMany({
      where: { id, organizationId },
      data: { deletedAt: null, updatedAt },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Omit<CostCenterListCriteria, 'skip' | 'take'>,
  ): Prisma.CostCenterWhereInput {
    const and: Prisma.CostCenterWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (search) {
      and.push({ name: { contains: search, mode: 'insensitive' } });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: CostCenterRow): CostCenter {
    const props: CostCenterProps = {
      organizationId: row.organizationId,
      name: row.name,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return CostCenter.with(props, row.id);
  }
}
