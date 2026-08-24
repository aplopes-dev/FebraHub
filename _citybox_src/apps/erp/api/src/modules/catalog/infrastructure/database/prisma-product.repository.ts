import { Injectable } from '@nestjs/common';
import type { Prisma } from '../../../../../generated/prisma/client';
import { PrismaService } from '../../../../shared/infra/prisma/prisma.service';
import {
  ProductRepository,
  type ProductListCriteria,
  type ProductSortOption,
  type ProductTabCounts,
} from '../../domain/repositories/product.repository.interface';
import {
  Product,
  type ProductProps,
  type ProductType,
  type ProductVariationFormat,
} from '../../domain/entities/product.entity';

type ProductRow = {
  id: string;
  organizationId: string;
  name: string;
  sku: string;
  categoryId: string;
  unitOfMeasureId: string | null;
  type: string;
  basePriceCents: number;
  perishable: boolean;
  description: string;
  imageUrl: string | null;
  trackStock: boolean;
  barcodes: string[];
  availableOnErp: boolean;
  availableOnPdv: boolean;
  variationFormat: string | null;
  hasVariants: boolean;
  variantsCount: number;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  branches?: Array<{ branchId: string }>;
  suppliers?: Array<{
    supplierId: string;
    supplierCode: string | null;
    conversion: unknown;
  }>;
  productVariations?: Array<{
    variationId: string;
    minChoices: number;
    maxChoices: number;
    sortOrder: number;
    options: Array<{
      optionId: string;
      priceCents: number | null;
      barcode: string | null;
    }>;
  }>;
  addonSettings?: {
    minQuantity: number;
    maxQuantity: number;
    chargeFromSelectedQuantity: boolean;
    chargeFromQuantity: number;
  } | null;
  addonLines?: Array<{
    addonId: string;
    maxQuantity: number;
    priceCents: number;
    sortOrder: number;
  }>;
  suggestionsAsOwner?: Array<{
    suggestedProductId: string;
    sortOrder: number;
  }>;
};

const productInclude = {
  branches: { select: { branchId: true } },
  suppliers: {
    select: { supplierId: true, supplierCode: true, conversion: true },
  },
  productVariations: {
    orderBy: { sortOrder: 'asc' as const },
    include: {
      options: {
        select: { optionId: true, priceCents: true, barcode: true },
      },
    },
  },
  addonSettings: true,
  // Só linhas de adicional cujo catálogo segue ativo (FR-004: adicional
  // excluído some da leitura, mas o vínculo em si permanece no banco).
  addonLines: {
    where: { addon: { deletedAt: null } },
    orderBy: { sortOrder: 'asc' as const },
    select: {
      addonId: true,
      maxQuantity: true,
      priceCents: true,
      sortOrder: true,
    },
  },
  // Idem para sugestões: produto sugerido excluído some da leitura (FR-018).
  suggestionsAsOwner: {
    where: { suggestedProduct: { deletedAt: null } },
    orderBy: { sortOrder: 'asc' as const },
    select: { suggestedProductId: true, sortOrder: true },
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class PrismaProductRepository extends ProductRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async findById(organizationId: string, id: string): Promise<Product | null> {
    const row = await this.prisma.scoped.product.findFirst({
      where: { id, organizationId },
      include: productInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async findBySku(
    organizationId: string,
    sku: string,
  ): Promise<Product | null> {
    const row = await this.prisma.scoped.product.findFirst({
      where: { organizationId, sku: { equals: sku, mode: 'insensitive' } },
      include: productInclude,
    });
    return row ? this.toEntity(row) : null;
  }

  async findAll(
    organizationId: string,
    criteria: ProductListCriteria = {},
  ): Promise<Product[]> {
    const rows = await this.prisma.scoped.product.findMany({
      where: this.buildWhere(organizationId, criteria),
      include: productInclude,
      orderBy: this.buildOrderBy(criteria.sort),
      skip: criteria.skip,
      take: criteria.take,
    });
    return (rows as ProductRow[]).map((row) => this.toEntity(row));
  }

  count(
    organizationId: string,
    criteria: ProductListCriteria = {},
  ): Promise<number> {
    return this.prisma.scoped.product.count({
      where: this.buildWhere(organizationId, criteria),
    });
  }

  countByCategoryId(
    organizationId: string,
    categoryId: string,
  ): Promise<number> {
    return this.prisma.scoped.product.count({
      where: { organizationId, categoryId },
    });
  }

  countByUnitOfMeasureId(
    organizationId: string,
    unitOfMeasureId: string,
  ): Promise<number> {
    return this.prisma.scoped.product.count({
      where: { organizationId, unitOfMeasureId },
    });
  }

  async countByTabs(
    organizationId: string,
    branchId?: string | null,
  ): Promise<ProductTabCounts> {
    const branchCriteria = branchId ? { branchId } : {};

    const [all, withVariants, supplies, deleted] = await Promise.all([
      this.count(organizationId, { tab: 'all', ...branchCriteria }),
      this.count(organizationId, { tab: 'with_variants', ...branchCriteria }),
      this.count(organizationId, { tab: 'supplies', ...branchCriteria }),
      this.count(organizationId, { tab: 'deleted', ...branchCriteria }),
    ]);

    return { all, with_variants: withVariants, supplies, deleted };
  }

  async save(product: Product): Promise<Product> {
    const data = {
      organizationId: product.organizationId,
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      unitOfMeasureId: product.unitOfMeasureId,
      type: product.type,
      basePriceCents: product.basePriceCents,
      perishable: product.perishable,
      description: product.description,
      imageUrl: product.imageUrl,
      trackStock: product.trackStock,
      barcodes: product.barcodes,
      availableOnErp: product.availableOnErp,
      availableOnPdv: product.availableOnPdv,
      variationFormat: product.variationFormat,
      hasVariants: product.hasVariants,
      variantsCount: product.variantsCount,
      deletedAt: product.deletedAt,
      updatedAt: product.updatedAt,
    };

    // Produto e vínculos na mesma transação: um produto salvo com a lista de
    // unidades pela metade apareceria em filial errada até a próxima gravação.
    const row = await this.prisma.$transaction(async (tx) => {
      const saved = await tx.product.upsert({
        where: { id: product.id },
        create: { id: product.id, ...data, createdAt: product.createdAt },
        update: data,
      });

      await tx.productBranch.deleteMany({
        where: { productId: saved.id, organizationId: product.organizationId },
      });
      if (product.branchIds.length > 0) {
        await tx.productBranch.createMany({
          data: product.branchIds.map((branchId) => ({
            organizationId: product.organizationId,
            productId: saved.id,
            branchId,
            updatedAt: product.updatedAt,
          })),
          skipDuplicates: true,
        });
      }

      await tx.productSupplier.deleteMany({
        where: { productId: saved.id, organizationId: product.organizationId },
      });
      if (product.suppliers.length > 0) {
        await tx.productSupplier.createMany({
          data: product.suppliers.map((link) => ({
            organizationId: product.organizationId,
            productId: saved.id,
            supplierId: link.supplierId,
            supplierCode: link.supplierCode,
            conversion: link.conversion,
            updatedAt: product.updatedAt,
          })),
          skipDuplicates: true,
        });
      }

      // ProductVariationOption cascade-delete com o vínculo pai.
      await tx.productVariation.deleteMany({
        where: { productId: saved.id, organizationId: product.organizationId },
      });
      for (const link of product.variations) {
        const created = await tx.productVariation.create({
          data: {
            organizationId: product.organizationId,
            productId: saved.id,
            variationId: link.variationId,
            minChoices: link.minChoices,
            maxChoices: link.maxChoices,
            sortOrder: link.sortOrder,
            updatedAt: product.updatedAt,
          },
        });

        if (link.optionIds.length > 0) {
          const overrideByOption = new Map(
            link.optionOverrides.map((item) => [item.optionId, item]),
          );
          await tx.productVariationOption.createMany({
            data: link.optionIds.map((optionId) => {
              const override = overrideByOption.get(optionId);
              return {
                organizationId: product.organizationId,
                productVariationId: created.id,
                optionId,
                priceCents: override?.priceCents ?? null,
                barcode: override?.barcode ?? null,
                updatedAt: product.updatedAt,
              };
            }),
          });
        }
      }

      // Adicionais: configuração 1:1 (upsert) + linhas (replace-all).
      await tx.productAddonSettings.upsert({
        where: { productId: saved.id },
        create: {
          organizationId: product.organizationId,
          productId: saved.id,
          minQuantity: product.addonSettings.minQuantity,
          maxQuantity: product.addonSettings.maxQuantity,
          chargeFromSelectedQuantity:
            product.addonSettings.chargeFromSelectedQuantity,
          chargeFromQuantity: product.addonSettings.chargeFromQuantity,
        },
        update: {
          minQuantity: product.addonSettings.minQuantity,
          maxQuantity: product.addonSettings.maxQuantity,
          chargeFromSelectedQuantity:
            product.addonSettings.chargeFromSelectedQuantity,
          chargeFromQuantity: product.addonSettings.chargeFromQuantity,
        },
      });

      await tx.productAddonLine.deleteMany({
        where: { productId: saved.id, organizationId: product.organizationId },
      });
      if (product.addonLines.length > 0) {
        await tx.productAddonLine.createMany({
          data: product.addonLines.map((line) => ({
            organizationId: product.organizationId,
            productId: saved.id,
            addonId: line.addonId,
            maxQuantity: line.maxQuantity,
            priceCents: line.priceCents,
            sortOrder: line.sortOrder,
          })),
          skipDuplicates: true,
        });
      }

      // Sugestões: replace-all.
      await tx.productSuggestion.deleteMany({
        where: { productId: saved.id, organizationId: product.organizationId },
      });
      if (product.suggestions.length > 0) {
        await tx.productSuggestion.createMany({
          data: product.suggestions.map((link) => ({
            organizationId: product.organizationId,
            productId: saved.id,
            suggestedProductId: link.suggestedProductId,
            sortOrder: link.sortOrder,
          })),
          skipDuplicates: true,
        });
      }

      return tx.product.findFirstOrThrow({
        where: { id: saved.id },
        include: productInclude,
      });
    });

    return this.toEntity(row);
  }

  async softDeleteMany(organizationId: string, ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.prisma.scoped.product.updateMany({
      where: { organizationId, id: { in: ids }, deletedAt: null },
      data: { deletedAt: new Date(), updatedAt: new Date() },
    });
    return result.count;
  }

  /**
   * Aba e filtros são compostos com AND — nunca por atribuição direta no mesmo
   * campo. Aba e filtro podem tocar a MESMA coluna (ex.: aba "Insumos" define
   * `type=supply` e o filtro de tipo define outro conjunto); sobrescrever
   * perderia a restrição da aba e devolveria linhas a mais. Combinações
   * contraditórias resultam em lista vazia, que é o comportamento correto.
   */
  private buildWhere(
    organizationId: string,
    criteria: ProductListCriteria = {},
  ): Prisma.ProductWhereInput {
    const and: Prisma.ProductWhereInput[] = [];
    const tab = criteria.tab ?? 'all';

    if (tab === 'deleted') {
      and.push({ deletedAt: { not: null } });
    } else {
      and.push({ deletedAt: null });
      if (tab === 'with_variants') and.push({ hasVariants: true });
      if (tab === 'supplies') and.push({ type: 'supply' });
    }

    if (criteria.search) {
      and.push({
        OR: [
          { name: { contains: criteria.search, mode: 'insensitive' } },
          { sku: { contains: criteria.search, mode: 'insensitive' } },
        ],
      });
    }

    if (criteria.types?.length) {
      and.push({ type: { in: criteria.types } });
    }

    if (criteria.variants === 'with') and.push({ hasVariants: true });
    if (criteria.variants === 'without') and.push({ hasVariants: false });

    if (criteria.categoryIds?.length) {
      and.push({ categoryId: { in: criteria.categoryIds } });
    }

    // Recorte por unidade: só os produtos vinculados àquela filial.
    if (criteria.branchId) {
      and.push({
        branches: {
          some: {
            branchId: criteria.branchId,
            ...(criteria.branchActiveOnly ? { active: true } : {}),
          },
        },
      });
    }

    if (criteria.trackStock === true) {
      and.push({ trackStock: true });
    }

    if (typeof criteria.availableOnErp === 'boolean') {
      and.push({ availableOnErp: criteria.availableOnErp });
    }

    if (typeof criteria.availableOnPdv === 'boolean') {
      and.push({ availableOnPdv: criteria.availableOnPdv });
    }

    return { organizationId, AND: and };
  }

  private buildOrderBy(
    sort: ProductSortOption = 'name_asc',
  ): Prisma.ProductOrderByWithRelationInput {
    switch (sort) {
      case 'name_desc':
        return { name: 'desc' };
      case 'price_asc':
        return { basePriceCents: 'asc' };
      case 'price_desc':
        return { basePriceCents: 'desc' };
      // `stock_*` é ordenado no ListProductsUseCase (agregação de saldos).
      case 'stock_asc':
      case 'stock_desc':
      case 'name_asc':
      default:
        return { name: 'asc' };
    }
  }

  private toEntity(row: ProductRow): Product {
    const props: ProductProps = {
      organizationId: row.organizationId,
      name: row.name,
      sku: row.sku,
      categoryId: row.categoryId,
      unitOfMeasureId: row.unitOfMeasureId,
      type: row.type as ProductType,
      basePriceCents: row.basePriceCents,
      perishable: row.perishable,
      description: row.description,
      imageUrl: row.imageUrl,
      trackStock: row.trackStock,
      barcodes: row.barcodes,
      availableOnErp: row.availableOnErp,
      availableOnPdv: row.availableOnPdv,
      branchIds: (row.branches ?? []).map((link) => link.branchId),
      suppliers: (row.suppliers ?? []).map((link) => ({
        supplierId: link.supplierId,
        supplierCode: link.supplierCode,
        // `conversion` é Decimal no Postgres; o Prisma devolve um objeto com
        // toString — Number() direto perderia a precisão declarada.
        conversion: Number(String(link.conversion)),
      })),
      variationFormat: (row.variationFormat as ProductVariationFormat) ?? null,
      variations: (row.productVariations ?? []).map((link) => ({
        variationId: link.variationId,
        optionIds: link.options.map((option) => option.optionId),
        minChoices: link.minChoices,
        maxChoices: link.maxChoices,
        sortOrder: link.sortOrder,
        optionOverrides: link.options
          .filter(
            (option) =>
              option.priceCents !== null ||
              (option.barcode !== null && option.barcode.length > 0),
          )
          .map((option) => ({
            optionId: option.optionId,
            priceCents: option.priceCents,
            barcode: option.barcode,
          })),
      })),
      hasVariants: row.hasVariants,
      variantsCount: row.variantsCount,
      addonSettings: row.addonSettings
        ? {
            minQuantity: row.addonSettings.minQuantity,
            maxQuantity: row.addonSettings.maxQuantity,
            chargeFromSelectedQuantity:
              row.addonSettings.chargeFromSelectedQuantity,
            chargeFromQuantity: row.addonSettings.chargeFromQuantity,
          }
        : {
            minQuantity: 0,
            maxQuantity: 0,
            chargeFromSelectedQuantity: false,
            chargeFromQuantity: 1,
          },
      addonLines: (row.addonLines ?? []).map((line) => ({
        addonId: line.addonId,
        maxQuantity: line.maxQuantity,
        priceCents: line.priceCents,
        sortOrder: line.sortOrder,
      })),
      suggestions: (row.suggestionsAsOwner ?? []).map((link) => ({
        suggestedProductId: link.suggestedProductId,
        sortOrder: link.sortOrder,
      })),
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Product.with(props, row.id);
  }
}
