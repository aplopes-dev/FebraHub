import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductFiscal,
  type FiscalBranchOverride,
} from '../../domain/entities/product-fiscal.entity';
import {
  ProductFiscalRepository,
  type FiscalParameterListRow,
  type FiscalParameterTabCounts,
  type FiscalParametersListCriteria,
} from '../../domain/repositories/product-fiscal.repository.interface';

type DecimalLike = { toString(): string } | number | string;

type FiscalBranchRow = {
  branchId: string;
  icms: string;
  pisCofins: string;
  ipi: string;
  cfop: string;
  issqn: string;
};

type FiscalRow = {
  id: string;
  organizationId: string;
  productId: string;
  ncm: string;
  origin: string;
  netWeightKg: DecimalLike;
  grossWeightKg: DecimalLike;
  cest: string;
  fcpPercent: DecimalLike;
  fcpStPercent: DecimalLike;
  fcpStRetainedPercent: DecimalLike;
  cstIbsCbs: string;
  taxClassification: string;
  icms: string;
  icmsApplyToAll: boolean;
  pisCofins: string;
  pisCofinsApplyToAll: boolean;
  ipi: string;
  ipiApplyToAll: boolean;
  cfop: string;
  cfopApplyToAll: boolean;
  issqn: string;
  issqnApplyToAll: boolean;
  pisCofinsGroupId: string | null;
  icmsGroupId: string | null;
  issqnGroupId: string | null;
  ipiGroupId: string | null;
  createdAt: Date;
  updatedAt: Date;
  branches?: FiscalBranchRow[];
};

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

@Injectable()
export class PrismaProductFiscalRepository extends ProductFiscalRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<ProductFiscal | null> {
    const row = await this.prisma.scoped.productFiscal.findFirst({
      where: { organizationId, productId },
      include: { branches: true },
    });
    return row ? this.toEntity(row) : null;
  }

  async list(
    organizationId: string,
    criteria: FiscalParametersListCriteria = {},
  ): Promise<FiscalParameterListRow[]> {
    const rows = await this.prisma.scoped.product.findMany({
      where: this.buildProductWhere(organizationId, criteria),
      orderBy: this.buildOrderBy(criteria.sort ?? 'name_asc'),
      skip: criteria.skip,
      take: criteria.take,
      include: {
        category: { select: { name: true } },
        fiscal: { select: { ncm: true, origin: true } },
      },
    });

    return rows.map((row) => ({
      productId: row.id,
      name: row.name,
      sku: row.sku,
      imageUrl: row.imageUrl,
      categoryName: row.category.name,
      configured: this.isConfigured(row.fiscal),
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<FiscalParametersListCriteria, 'skip' | 'take' | 'sort'> = {},
  ): Promise<number> {
    return this.prisma.scoped.product.count({
      where: this.buildProductWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<FiscalParameterTabCounts> {
    const [all, pending] = await Promise.all([
      this.prisma.scoped.product.count({
        where: { organizationId, deletedAt: null },
      }),
      this.prisma.scoped.product.count({
        where: this.buildProductWhere(organizationId, { tab: 'pending' }),
      }),
    ]);
    return { all, pending };
  }

  async upsert(fiscal: ProductFiscal): Promise<ProductFiscal> {
    const data = {
      organizationId: fiscal.organizationId,
      productId: fiscal.productId,
      ncm: fiscal.ncm,
      origin: fiscal.origin,
      netWeightKg: fiscal.netWeightKg,
      grossWeightKg: fiscal.grossWeightKg,
      cest: fiscal.cest,
      fcpPercent: fiscal.fcpPercent,
      fcpStPercent: fiscal.fcpStPercent,
      fcpStRetainedPercent: fiscal.fcpStRetainedPercent,
      cstIbsCbs: fiscal.cstIbsCbs,
      taxClassification: fiscal.taxClassification,
      icms: fiscal.icms.value,
      icmsApplyToAll: fiscal.icms.applyToAll,
      pisCofins: fiscal.pisCofins.value,
      pisCofinsApplyToAll: fiscal.pisCofins.applyToAll,
      ipi: fiscal.ipi.value,
      ipiApplyToAll: fiscal.ipi.applyToAll,
      cfop: fiscal.cfop.value,
      cfopApplyToAll: fiscal.cfop.applyToAll,
      issqn: fiscal.issqn.value,
      issqnApplyToAll: fiscal.issqn.applyToAll,
      pisCofinsGroupId: fiscal.pisCofinsGroupId,
      icmsGroupId: fiscal.icmsGroupId,
      issqnGroupId: fiscal.issqnGroupId,
      ipiGroupId: fiscal.ipiGroupId,
      updatedAt: fiscal.updatedAt,
    };

    const saved = await this.prisma.scoped.$transaction(async (tx) => {
      const row = await tx.productFiscal.upsert({
        where: { productId: fiscal.productId },
        create: {
          id: fiscal.id,
          ...data,
          createdAt: fiscal.createdAt,
        },
        update: data,
      });

      await tx.productFiscalBranch.deleteMany({
        where: {
          organizationId: fiscal.organizationId,
          productFiscalId: row.id,
        },
      });

      if (fiscal.branches.length > 0) {
        await tx.productFiscalBranch.createMany({
          data: fiscal.branches.map((branch) => ({
            organizationId: fiscal.organizationId,
            productFiscalId: row.id,
            productId: fiscal.productId,
            branchId: branch.branchId,
            icms: branch.icms,
            pisCofins: branch.pisCofins,
            ipi: branch.ipi,
            cfop: branch.cfop,
            issqn: branch.issqn,
            updatedAt: fiscal.updatedAt,
          })),
        });
      }

      return tx.productFiscal.findFirstOrThrow({
        where: { id: row.id },
        include: { branches: true },
      });
    });

    return this.toEntity(saved);
  }

  private isConfigured(
    fiscal: { ncm: string; origin: string } | null | undefined,
  ): boolean {
    if (!fiscal) return false;
    return fiscal.ncm.trim() !== '' && fiscal.origin.trim() !== '';
  }

  private buildProductWhere(
    organizationId: string,
    criteria: FiscalParametersListCriteria,
  ): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [
      { organizationId },
      { deletedAt: null },
    ];

    if (criteria.tab === 'pending') {
      and.push({
        OR: [
          { fiscal: null },
          { fiscal: { ncm: '' } },
          { fiscal: { origin: '' } },
        ],
      });
    }

    const search = criteria.search?.trim();
    if (search) {
      and.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { sku: { contains: search, mode: 'insensitive' } },
          { category: { name: { contains: search, mode: 'insensitive' } } },
        ],
      });
    }

    const category = criteria.category?.trim();
    const categories = (criteria.categories ?? [])
      .map((item) => item.trim())
      .filter(Boolean);
    const categoryFilters = [...(category ? [category] : []), ...categories];
    if (categoryFilters.length > 0) {
      and.push({
        OR: categoryFilters.flatMap((value) => [
          { categoryId: value },
          {
            category: { name: { equals: value, mode: 'insensitive' as const } },
          },
        ]),
      });
    }

    if (criteria.statuses?.length) {
      const wantsConfigured = criteria.statuses.includes('configured');
      const wantsPending = criteria.statuses.includes('pending');
      if (wantsConfigured && !wantsPending) {
        and.push({
          fiscal: {
            AND: [{ ncm: { not: '' } }, { origin: { not: '' } }],
          },
        });
      } else if (wantsPending && !wantsConfigured) {
        and.push({
          OR: [
            { fiscal: null },
            { fiscal: { ncm: '' } },
            { fiscal: { origin: '' } },
          ],
        });
      }
    }

    return { AND: and };
  }

  private buildOrderBy(
    sort: NonNullable<FiscalParametersListCriteria['sort']>,
  ): Prisma.ProductOrderByWithRelationInput[] {
    switch (sort) {
      case 'name_desc':
        return [{ name: 'desc' }];
      case 'category_asc':
        return [{ category: { name: 'asc' } }, { name: 'asc' }];
      case 'category_desc':
        return [{ category: { name: 'desc' } }, { name: 'asc' }];
      case 'name_asc':
      default:
        return [{ name: 'asc' }];
    }
  }

  private toEntity(row: FiscalRow): ProductFiscal {
    const branches: FiscalBranchOverride[] = (row.branches ?? []).map(
      (branch) => ({
        branchId: branch.branchId,
        icms: branch.icms,
        pisCofins: branch.pisCofins,
        ipi: branch.ipi,
        cfop: branch.cfop,
        issqn: branch.issqn,
      }),
    );

    return ProductFiscal.with(
      {
        organizationId: row.organizationId,
        productId: row.productId,
        ncm: row.ncm,
        origin: row.origin,
        netWeightKg: toNumber(row.netWeightKg),
        grossWeightKg: toNumber(row.grossWeightKg),
        cest: row.cest,
        fcpPercent: toNumber(row.fcpPercent),
        fcpStPercent: toNumber(row.fcpStPercent),
        fcpStRetainedPercent: toNumber(row.fcpStRetainedPercent),
        cstIbsCbs: row.cstIbsCbs,
        taxClassification: row.taxClassification,
        icms: { value: row.icms, applyToAll: row.icmsApplyToAll },
        pisCofins: {
          value: row.pisCofins,
          applyToAll: row.pisCofinsApplyToAll,
        },
        ipi: { value: row.ipi, applyToAll: row.ipiApplyToAll },
        cfop: { value: row.cfop, applyToAll: row.cfopApplyToAll },
        issqn: { value: row.issqn, applyToAll: row.issqnApplyToAll },
        pisCofinsGroupId: row.pisCofinsGroupId ?? null,
        icmsGroupId: row.icmsGroupId ?? null,
        issqnGroupId: row.issqnGroupId ?? null,
        ipiGroupId: row.ipiGroupId ?? null,
        branches,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
