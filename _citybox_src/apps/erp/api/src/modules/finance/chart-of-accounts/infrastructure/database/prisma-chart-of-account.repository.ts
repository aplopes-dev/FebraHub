import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../../generated/prisma/client';
import { PrismaService } from '../../../../../shared/infra/prisma/prisma.service';
import {
  ChartOfAccount,
  type ChartOfAccountProps,
} from '../../domain/entities/chart-of-account.entity';
import {
  ChartOfAccountRepository,
  type ChartOfAccountFinancialGroupType,
  type ChartOfAccountListCriteria,
  type ChartOfAccountWithGroup,
} from '../../domain/repositories/chart-of-account.repository.interface';

type ChartOfAccountRow = {
  id: string;
  organizationId: string;
  name: string;
  financialGroupId: string;
  availableForPdv: boolean;
  systemKey: string | null;
  isSystem: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  financialGroup?: { name: string; type: string } | null;
};

const WITH_GROUP = {
  financialGroup: { select: { name: true, type: true } },
} as const;

/**
 * Usa `prisma.scoped`: o filtro global injeta o `organizationId` do contexto em
 * toda query, mesmo nas que já o passam explicitamente aqui. As duas travas são
 * de propósito — uma pega o esquecimento, a outra o bug de chamada.
 */
@Injectable()
export class PrismaChartOfAccountRepository extends ChartOfAccountRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<ChartOfAccount | null> {
    const row = await this.prisma.scoped.chartOfAccount.findFirst({
      where: { id, organizationId },
    });
    return row ? this.toEntity(row) : null;
  }

  async findByIdWithGroup(
    organizationId: string,
    id: string,
  ): Promise<ChartOfAccountWithGroup | null> {
    const row = await this.prisma.scoped.chartOfAccount.findFirst({
      where: { id, organizationId },
      include: WITH_GROUP,
    });
    return row ? this.toItem(row) : null;
  }

  async findByName(
    organizationId: string,
    name: string,
  ): Promise<ChartOfAccount | null> {
    const trimmed = name.trim();
    if (!trimmed) return null;

    // Inclui as excluídas de propósito: o unique do banco
    // (`organizationId, name`) não conhece soft-delete. Filtrar aqui faria a
    // checagem passar e o INSERT estourar como 500.
    const row = await this.prisma.scoped.chartOfAccount.findFirst({
      where: {
        organizationId,
        name: { equals: trimmed, mode: 'insensitive' },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: ChartOfAccountListCriteria = {},
  ): Promise<ChartOfAccountWithGroup[]> {
    const rows = await this.prisma.scoped.chartOfAccount.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: WITH_GROUP,
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return rows.map((row) => this.toItem(row));
  }

  count(
    organizationId: string,
    criteria: ChartOfAccountListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.chartOfAccount.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  async save(account: ChartOfAccount): Promise<ChartOfAccount> {
    const data = {
      organizationId: account.organizationId,
      name: account.name,
      financialGroupId: account.financialGroupId,
      availableForPdv: account.availableForPdv,
      deletedAt: account.deletedAt,
      updatedAt: account.updatedAt,
    };

    const row = await this.prisma.scoped.chartOfAccount.upsert({
      where: { id: account.id },
      create: { id: account.id, ...data, createdAt: account.createdAt },
      update: data,
    });

    return this.toEntity(row);
  }

  private buildWhere(
    organizationId: string,
    criteria: ChartOfAccountListCriteria,
  ): Prisma.ChartOfAccountWhereInput {
    const and: Prisma.ChartOfAccountWhereInput[] = [];
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

  private toEntity(row: ChartOfAccountRow): ChartOfAccount {
    const props: ChartOfAccountProps = {
      organizationId: row.organizationId,
      name: row.name,
      financialGroupId: row.financialGroupId,
      availableForPdv: row.availableForPdv,
      systemKey: row.systemKey,
      isSystem: row.isSystem,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return ChartOfAccount.with(props, row.id);
  }

  private toItem(row: ChartOfAccountRow): ChartOfAccountWithGroup {
    return {
      account: this.toEntity(row),
      financialGroupName: row.financialGroup?.name ?? '',
      financialGroupType: (row.financialGroup?.type ??
        'despesa') as ChartOfAccountFinancialGroupType,
    };
  }
}
