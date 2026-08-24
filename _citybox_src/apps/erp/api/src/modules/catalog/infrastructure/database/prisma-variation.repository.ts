import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  VariationRepository,
  type VariationListCriteria,
} from '../../domain/repositories/variation.repository.interface';
import {
  Variation,
  type VariationPriceMethod,
  type VariationProps,
} from '../../domain/entities/variation.entity';

type VariationOptionRow = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  priceCents: number;
  code: string;
  sortOrder: number;
};

type VariationRow = {
  id: string;
  organizationId: string;
  name: string;
  chooseFrom: number;
  chooseTo: number;
  chargeFromSelectedQuantity: boolean;
  chargeFromQuantity: number;
  priceMethod: string;
  createdAt: Date;
  updatedAt: Date;
  options: VariationOptionRow[];
  productLinks: Array<{ product: { name: string } }>;
};

const variationInclude = {
  options: { orderBy: { sortOrder: 'asc' as const } },
  productLinks: {
    include: { product: { select: { name: true } } },
  },
} satisfies Prisma.VariationInclude;

@Injectable()
export class PrismaVariationRepository extends VariationRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(
    organizationId: string,
    id: string,
  ): Promise<Variation | null> {
    const row = await this.prisma.scoped.variation.findFirst({
      where: { id, organizationId },
      include: variationInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: VariationListCriteria = {},
  ): Promise<Variation[]> {
    const rows = await this.prisma.scoped.variation.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: variationInclude,
      orderBy: { name: 'asc' },
      skip: criteria.skip,
      take: criteria.take,
    });
    return (rows as VariationRow[]).map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: Pick<VariationListCriteria, 'search'> = {},
  ): Promise<number> {
    return this.prisma.scoped.variation.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  countProductsUsing(
    organizationId: string,
    variationId: string,
  ): Promise<number> {
    return this.prisma.scoped.productVariation.count({
      where: { organizationId, variationId },
    });
  }

  async save(variation: Variation): Promise<Variation> {
    const data = {
      organizationId: variation.organizationId,
      name: variation.name,
      chooseFrom: variation.calculation.chooseFrom,
      chooseTo: variation.calculation.chooseTo,
      chargeFromSelectedQuantity:
        variation.calculation.chargeFromSelectedQuantity,
      chargeFromQuantity: variation.calculation.chargeFromQuantity,
      priceMethod: variation.calculation.priceMethod,
      updatedAt: variation.updatedAt,
    };

    await this.prisma.scoped.$transaction(async (tx) => {
      await tx.variation.upsert({
        where: { id: variation.id },
        create: {
          id: variation.id,
          ...data,
          createdAt: variation.createdAt,
        },
        update: data,
      });

      const incomingIds = variation.options.map((option) => option.id);

      await tx.variationOption.deleteMany({
        where: {
          organizationId: variation.organizationId,
          variationId: variation.id,
          ...(incomingIds.length > 0 ? { id: { notIn: incomingIds } } : {}),
        },
      });

      for (const option of variation.options) {
        await tx.variationOption.upsert({
          where: { id: option.id },
          create: {
            id: option.id,
            organizationId: variation.organizationId,
            variationId: variation.id,
            name: option.name,
            description: option.description,
            imageUrl: option.imageUrl,
            priceCents: option.priceCents,
            code: option.code,
            sortOrder: option.sortOrder,
          },
          update: {
            name: option.name,
            description: option.description,
            imageUrl: option.imageUrl,
            priceCents: option.priceCents,
            code: option.code,
            sortOrder: option.sortOrder,
          },
        });
      }
    });

    const saved = await this.findById(variation.organizationId, variation.id);
    if (!saved) {
      throw new Error(`Variation ${variation.id} missing after save`);
    }
    return saved;
  }

  async delete(organizationId: string, id: string): Promise<void> {
    await this.prisma.scoped.variation.deleteMany({
      where: { id, organizationId },
    });
  }

  private buildWhere(
    organizationId: string,
    criteria: Pick<VariationListCriteria, 'search'>,
  ): Prisma.VariationWhereInput {
    const search = criteria.search?.trim();
    return {
      organizationId,
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              {
                options: {
                  some: { name: { contains: search, mode: 'insensitive' } },
                },
              },
            ],
          }
        : {}),
    };
  }

  private toEntity(row: VariationRow): Variation {
    const productNames = [
      ...new Set(row.productLinks.map((link) => link.product.name)),
    ];

    const props: VariationProps = {
      organizationId: row.organizationId,
      name: row.name,
      calculation: {
        chooseFrom: row.chooseFrom,
        chooseTo: row.chooseTo,
        chargeFromSelectedQuantity: row.chargeFromSelectedQuantity,
        chargeFromQuantity: row.chargeFromQuantity,
        priceMethod: row.priceMethod as VariationPriceMethod,
      },
      options: row.options.map((option) => ({
        id: option.id,
        name: option.name,
        description: option.description,
        imageUrl: option.imageUrl,
        priceCents: option.priceCents,
        code: option.code,
        sortOrder: option.sortOrder,
      })),
      productNames,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    return Variation.with(props, row.id);
  }
}
