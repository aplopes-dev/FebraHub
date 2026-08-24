import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  TechnicalSheet,
  type ProductionType,
} from '../../domain/entities/technical-sheet.entity';
import {
  TechnicalSheetRepository,
  type TechnicalSheetDetailView,
  type TechnicalSheetListRow,
  type TechnicalSheetTabCounts,
  type TechnicalSheetsListCriteria,
} from '../../domain/repositories/technical-sheet.repository.interface';

type DecimalLike = { toString(): string } | number | string;

function toNumber(value: DecimalLike): number {
  if (typeof value === 'number') return value;
  return Number(value.toString());
}

function toQuantityString(value: DecimalLike): string {
  const n = toNumber(value);
  if (Number.isInteger(n)) return String(n);
  return String(n);
}

type SheetRow = {
  id: string;
  organizationId: string;
  productId: string;
  productionType: ProductionType;
  maxRemovableComponents: number;
  markupPercent: DecimalLike;
  createdAt: Date;
  updatedAt: Date;
  components?: Array<{
    id: string;
    componentProductId: string;
    optional: boolean;
    quantity: DecimalLike;
    sortOrder: number;
  }>;
  optionComponents?: Array<{
    id: string;
    variationOptionId: string;
    componentProductId: string;
    optional: boolean;
    quantity: DecimalLike;
    sortOrder: number;
  }>;
};

@Injectable()
export class PrismaTechnicalSheetRepository extends TechnicalSheetRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheet | null> {
    const row = await this.prisma.scoped.technicalSheet.findFirst({
      where: { organizationId, productId },
      include: {
        components: { orderBy: { sortOrder: 'asc' } },
        optionComponents: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return row ? this.toEntity(row) : null;
  }

  async findDetailByProductId(
    organizationId: string,
    productId: string,
  ): Promise<TechnicalSheetDetailView | null> {
    const product = await this.prisma.scoped.product.findFirst({
      where: { organizationId, id: productId },
      include: {
        category: { select: { name: true } },
        technicalSheet: {
          include: {
            components: {
              orderBy: { sortOrder: 'asc' },
              include: {
                component: {
                  include: {
                    unitOfMeasure: { select: { abbreviation: true } },
                  },
                },
              },
            },
            optionComponents: {
              orderBy: { sortOrder: 'asc' },
              include: {
                component: {
                  include: {
                    unitOfMeasure: { select: { abbreviation: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!product) return null;

    const sheet = product.technicalSheet
      ? this.toEntity(product.technicalSheet)
      : null;

    const components = (product.technicalSheet?.components ?? []).map(
      (row) => ({
        id: row.id,
        componentProductId: row.componentProductId,
        name: row.component.name,
        unit: row.component.unitOfMeasure?.abbreviation ?? 'un',
        optional: row.optional,
        quantity: toQuantityString(row.quantity),
        unitCostCents: row.component.basePriceCents,
        sortOrder: row.sortOrder,
      }),
    );

    const optionComponents = (
      product.technicalSheet?.optionComponents ?? []
    ).map((row) => ({
      id: row.id,
      variationOptionId: row.variationOptionId,
      componentProductId: row.componentProductId,
      name: row.component.name,
      unit: row.component.unitOfMeasure?.abbreviation ?? 'un',
      optional: row.optional,
      quantity: toQuantityString(row.quantity),
      unitCostCents: row.component.basePriceCents,
      sortOrder: row.sortOrder,
    }));

    const totalCostCents = components.reduce(
      (sum, row) =>
        sum + Math.round(toNumber(row.quantity) * row.unitCostCents),
      0,
    );

    return {
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: product.imageUrl,
      categoryName: product.category.name,
      productionType: sheet?.productionType ?? 'automatic',
      maxRemovableComponents: sheet?.maxRemovableComponents ?? 0,
      markupPercent: sheet?.markupPercent ?? 0,
      currentPriceCents: product.basePriceCents,
      totalCostCents,
      hasSheet: sheet !== null,
      components,
      optionComponents,
      sheet,
    };
  }

  async list(
    organizationId: string,
    criteria: TechnicalSheetsListCriteria = {},
  ): Promise<TechnicalSheetListRow[]> {
    const rows = await this.prisma.scoped.product.findMany({
      where: this.buildProductWhere(organizationId, criteria),
      orderBy: this.buildOrderBy(criteria.sort ?? 'name_asc'),
      skip: criteria.skip,
      take: criteria.take,
      include: {
        category: { select: { name: true } },
        technicalSheet: {
          select: {
            productionType: true,
            components: { select: { id: true }, take: 1 },
            optionComponents: { select: { id: true }, take: 1 },
          },
        },
      },
    });

    return rows.map((row) => ({
      productId: row.id,
      name: row.name,
      sku: row.sku,
      imageUrl: row.imageUrl,
      categoryName: row.category.name,
      productionType: row.technicalSheet?.productionType ?? null,
      hasComposition:
        (row.technicalSheet?.components.length ?? 0) > 0 ||
        (row.technicalSheet?.optionComponents.length ?? 0) > 0,
    }));
  }

  count(
    organizationId: string,
    criteria: Omit<TechnicalSheetsListCriteria, 'skip' | 'take' | 'sort'> = {},
  ): Promise<number> {
    return this.prisma.scoped.product.count({
      where: this.buildProductWhere(organizationId, criteria),
    });
  }

  async countByTabs(organizationId: string): Promise<TechnicalSheetTabCounts> {
    const [all, production] = await Promise.all([
      this.prisma.scoped.product.count({
        where: this.buildProductWhere(organizationId, { tab: 'all' }),
      }),
      this.prisma.scoped.product.count({
        where: this.buildProductWhere(organizationId, { tab: 'production' }),
      }),
    ]);
    return { all, production };
  }

  async upsert(sheet: TechnicalSheet): Promise<TechnicalSheet> {
    const data = {
      organizationId: sheet.organizationId,
      productId: sheet.productId,
      productionType: sheet.productionType,
      maxRemovableComponents: sheet.maxRemovableComponents,
      markupPercent: sheet.markupPercent,
      updatedAt: sheet.updatedAt,
    };

    const saved = await this.prisma.scoped.$transaction(async (tx) => {
      const row = await tx.technicalSheet.upsert({
        where: { productId: sheet.productId },
        create: {
          id: sheet.id,
          ...data,
          createdAt: sheet.createdAt,
        },
        update: data,
      });

      await tx.technicalSheetComponent.deleteMany({
        where: {
          organizationId: sheet.organizationId,
          technicalSheetId: row.id,
        },
      });
      await tx.technicalSheetOptionComponent.deleteMany({
        where: {
          organizationId: sheet.organizationId,
          technicalSheetId: row.id,
        },
      });

      if (sheet.components.length > 0) {
        await tx.technicalSheetComponent.createMany({
          data: sheet.components.map((component) => ({
            id: component.id,
            organizationId: sheet.organizationId,
            technicalSheetId: row.id,
            componentProductId: component.componentProductId,
            optional: component.optional,
            quantity: component.quantity,
            sortOrder: component.sortOrder,
            updatedAt: sheet.updatedAt,
          })),
        });
      }

      if (sheet.optionComponents.length > 0) {
        await tx.technicalSheetOptionComponent.createMany({
          data: sheet.optionComponents.map((component) => ({
            id: component.id,
            organizationId: sheet.organizationId,
            technicalSheetId: row.id,
            variationOptionId: component.variationOptionId,
            componentProductId: component.componentProductId,
            optional: component.optional,
            quantity: component.quantity,
            sortOrder: component.sortOrder,
            updatedAt: sheet.updatedAt,
          })),
        });
      }

      return tx.technicalSheet.findFirstOrThrow({
        where: { id: row.id },
        include: {
          components: { orderBy: { sortOrder: 'asc' } },
          optionComponents: { orderBy: { sortOrder: 'asc' } },
        },
      });
    });

    return this.toEntity(saved);
  }

  private buildProductWhere(
    organizationId: string,
    criteria: TechnicalSheetsListCriteria,
  ): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [
      { organizationId },
      { deletedAt: null },
      { type: { not: 'supply' } },
    ];

    if (criteria.tab === 'production') {
      and.push({
        technicalSheet: { productionType: 'productive_process' },
      });
    }

    if (criteria.productionTypes?.length) {
      and.push({
        technicalSheet: {
          productionType: { in: criteria.productionTypes },
        },
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

    return { AND: and };
  }

  private buildOrderBy(
    sort: TechnicalSheetsListCriteria['sort'],
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

  private toEntity(row: SheetRow): TechnicalSheet {
    return TechnicalSheet.with(
      {
        organizationId: row.organizationId,
        productId: row.productId,
        productionType: row.productionType,
        maxRemovableComponents: row.maxRemovableComponents,
        markupPercent: toNumber(row.markupPercent),
        components: (row.components ?? []).map((component) => ({
          id: component.id,
          componentProductId: component.componentProductId,
          optional: component.optional,
          quantity: toNumber(component.quantity),
          sortOrder: component.sortOrder,
        })),
        optionComponents: (row.optionComponents ?? []).map((component) => ({
          id: component.id,
          variationOptionId: component.variationOptionId,
          componentProductId: component.componentProductId,
          optional: component.optional,
          quantity: toNumber(component.quantity),
          sortOrder: component.sortOrder,
        })),
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      },
      row.id,
    );
  }
}
