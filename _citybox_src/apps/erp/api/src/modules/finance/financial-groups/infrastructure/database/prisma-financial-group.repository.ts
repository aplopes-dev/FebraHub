import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  FinancialGroupRepository,
  type FinancialGroupListCriteria,
} from '../../domain/repositories/financial-group.repository.interface';
import {
  FinancialGroup,
  type FinancialGroupClassification,
  type FinancialGroupProps,
  type FinancialGroupSign,
  type FinancialGroupType,
} from '../../domain/entities/financial-group.entity';

type FinancialGroupRow = {
  id: string;
  organizationId: string;
  name: string;
  type: FinancialGroupType;
  systemKey: string | null;
  isSystem: boolean;
  classification: FinancialGroupClassification;
  catalogOrder: number;
  sign: FinancialGroupSign | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaFinancialGroupRepository extends FinancialGroupRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<FinancialGroup | null> {
    const row = await this.prisma.scoped.financialGroup.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<FinancialGroup | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    // Inclui os excluídos: o unique (`organizationId, name`) não conhece
    // soft-delete — filtrar ativos aqui faria o create passar e o INSERT 500.
    const row = await this.prisma.scoped.financialGroup.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: FinancialGroupListCriteria = {},
  ): Promise<FinancialGroup[]> {
    const rows = await this.prisma.scoped.financialGroup.findMany({
      where: this.buildWhere(organizationId, criteria),
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: FinancialGroupListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.financialGroup.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  countChartOfAccounts(
    organizationId: string,
    groupId: string,
  ): Promise<number> {
    return this.prisma.scoped.chartOfAccount.count({
      where: {
        organizationId,
        financialGroupId: groupId,
        deletedAt: null,
      },
    });
  }

  async save(group: FinancialGroup): Promise<FinancialGroup> {
    const data = {
      organizationId: group.organizationId,
      name: group.name,
      type: group.type,
      classification: group.classification,
      deletedAt: group.deletedAt,
      updatedAt: group.updatedAt,
    };

    const row = await this.prisma.scoped.financialGroup.upsert({
      where: { id: group.id },
      create: { id: group.id, ...data, createdAt: group.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: FinancialGroupListCriteria,
  ): Prisma.FinancialGroupWhereInput {
    const and: Prisma.FinancialGroupWhereInput[] = [];
    const search = criteria.search?.trim();

    and.push(
      criteria.tab === 'deleted'
        ? { deletedAt: { not: null } }
        : { deletedAt: null },
    );

    if (criteria.type) and.push({ type: criteria.type });

    if (search) {
      and.push({ name: { contains: search, mode: 'insensitive' } });
    }

    return { organizationId, AND: and };
  }

  private toEntity(row: FinancialGroupRow): FinancialGroup {
    const props: FinancialGroupProps = {
      organizationId: row.organizationId,
      name: row.name,
      type: row.type,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      classification: row.classification,
      catalogOrder: row.catalogOrder,
      sign: row.sign,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return FinancialGroup.with(props, row.id);
  }
}
