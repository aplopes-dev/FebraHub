import { Injectable } from '@nestjs/common';
import type { IUseCase } from '../../../../../shared/core/use-case.interface';
import type { Product } from '../../../../catalog/domain/entities/product.entity';
import { ProductAddonRepository } from '../../../../catalog/domain/repositories/product-addon.repository.interface';
import { ProductCategoryRepository } from '../../../../catalog/domain/repositories/product-category.repository.interface';
import { ProductRepository } from '../../../../catalog/domain/repositories/product.repository.interface';
import { PriceListRepository } from '../../../../catalog/domain/repositories/price-list.repository.interface';
import { UnitOfMeasureRepository } from '../../../../catalog/domain/repositories/unit-of-measure.repository.interface';
import { VariationRepository } from '../../../../catalog/domain/repositories/variation.repository.interface';
import { StockMovementRepository } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import { StockRepository } from '../../../../stock/domain/repositories/stock.repository.interface';
import { flattenProductVariants } from '../../../domain/services/flatten-product-variants';
import {
  buildPdvPriceIndex,
  resolvePdvSellPriceCents,
} from '../../../domain/services/resolve-pdv-sell-price';
import type {
  GetTerminalCatalogDto,
  PosCatalogProductDto,
  TerminalCatalogSnapshot,
} from '../../dtos/pos-catalog.dto';

/**
 * Snapshot de catálogo para o terminal — unidade implícita no `branchId`.
 *
 * Devolve o conjunto **já resolvido** (preço do canal `pdv`, variantes
 * flattenadas). O app não remescla listas de preço.
 */
@Injectable()
export class GetTerminalCatalogUseCase implements IUseCase<
  GetTerminalCatalogDto,
  TerminalCatalogSnapshot
> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly categoryRepository: ProductCategoryRepository,
    private readonly addonRepository: ProductAddonRepository,
    private readonly priceListRepository: PriceListRepository,
    private readonly unitOfMeasureRepository: UnitOfMeasureRepository,
    private readonly variationRepository: VariationRepository,
    private readonly stockRepository: StockRepository,
    private readonly stockMovementRepository: StockMovementRepository,
  ) {}

  async execute(
    input: GetTerminalCatalogDto,
  ): Promise<TerminalCatalogSnapshot> {
    const now = new Date();
    const organizationId = input.organizationId;

    const [products, categories, addons, priceLists, units, variations] =
      await Promise.all([
        this.productRepository.findAll(organizationId, {
          tab: 'all',
          types: ['simple', 'collection'],
          branchId: input.branchId,
          branchActiveOnly: true,
          availableOnPdv: true,
          sort: 'name_asc',
        }),
        this.categoryRepository.findAll(organizationId, { activeOnly: true }),
        this.addonRepository.findAll(organizationId, { activeOnly: true }),
        this.priceListRepository.findAllOrderedByPriority(organizationId),
        this.unitOfMeasureRepository.findAll(organizationId),
        this.variationRepository.findAll(organizationId),
      ]);

    const itemsByListId = new Map(
      await Promise.all(
        priceLists.map(async (list) => {
          const items = await this.priceListRepository.findItems(
            organizationId,
            list.id,
          );
          return [list.id, items] as const;
        }),
      ),
    );

    const priceIndex = buildPdvPriceIndex(priceLists, itemsByListId, now);
    const unitKindById = new Map(units.map((unit) => [unit.id, unit.kind]));
    const variationsById = new Map(
      variations.map((variation) => [variation.id, variation]),
    );

    const categoryIdsUsed = new Set(products.map((p) => p.categoryId));
    const addonIdsUsed = new Set(
      products.flatMap((p) => p.addonLines.map((line) => line.addonId)),
    );

    const stockQtyByProductId = await this.resolveStockQtyByProductId(
      organizationId,
      input.branchId,
      products,
    );

    return {
      categories: categories
        .filter((category) => categoryIdsUsed.has(category.id))
        .map((category) => ({ id: category.id, name: category.name })),
      addons: addons
        .filter((addon) => addonIdsUsed.has(addon.id))
        .map((addon) => ({
          id: addon.id,
          name: addon.name,
          unitPriceCents: addon.defaultPriceCents,
        })),
      products: products.map((product) =>
        this.toProductDto(
          product,
          priceIndex,
          unitKindById,
          variationsById,
          now,
          stockQtyByProductId,
        ),
      ),
      syncedAt: now,
    };
  }

  /**
   * Mesmo critério de `CreatePosSaleUseCase.resolveDefaultStockId`.
   * Sem depósito → mapa vazio (produtos `trackStock` ficam com `stockQty=null`).
   */
  private async resolveStockQtyByProductId(
    organizationId: string,
    branchId: string,
    products: Product[],
  ): Promise<Map<string, string> | null> {
    const trackStockIds = products
      .filter((product) => product.trackStock)
      .map((product) => product.id);
    if (trackStockIds.length === 0) return new Map();

    const stockId = await this.resolveDefaultStockId(organizationId, branchId);
    if (!stockId) return null;

    return this.stockMovementRepository.getBalancesForStockProducts(
      organizationId,
      stockId,
      trackStockIds,
    );
  }

  private async resolveDefaultStockId(
    organizationId: string,
    branchId: string,
  ): Promise<string | null> {
    const stocks = await this.stockRepository.findAll(organizationId);
    const defaultForBranch = stocks.find(
      (stock) => stock.isDefault && stock.branchIds.includes(branchId),
    );
    if (defaultForBranch) return defaultForBranch.id;

    const anyForBranch = stocks.find((stock) =>
      stock.branchIds.includes(branchId),
    );
    return anyForBranch?.id ?? null;
  }

  private toProductDto(
    product: Product,
    priceIndex: ReturnType<typeof buildPdvPriceIndex>,
    unitKindById: Map<string, string>,
    variationsById: Map<
      string,
      import('../../../../catalog/domain/entities/variation.entity').Variation
    >,
    now: Date,
    stockQtyByProductId: Map<string, string> | null,
  ): PosCatalogProductDto {
    const priceCents = resolvePdvSellPriceCents(
      product.id,
      product.basePriceCents,
      priceIndex,
      now,
    );
    const soldByWeight =
      !!product.unitOfMeasureId &&
      unitKindById.get(product.unitOfMeasureId) === 'weight';
    const allowsAddons = product.addonLines.length > 0;
    const hasCustomAddonSettings =
      product.addonSettings.minQuantity !== 0 ||
      product.addonSettings.maxQuantity !== 0 ||
      product.addonSettings.chargeFromSelectedQuantity ||
      product.addonSettings.chargeFromQuantity !== 1;

    const trackStock = product.trackStock;
    let stockQty: string | null = null;
    if (trackStock) {
      if (stockQtyByProductId === null) {
        stockQty = null;
      } else {
        stockQty = stockQtyByProductId.get(product.id) ?? '0';
      }
    }

    return {
      id: product.id,
      name: product.name,
      categoryId: product.categoryId,
      sku: product.sku,
      priceCents,
      barcodes: [...product.barcodes],
      allowsAddons,
      allowsKitchenNote: allowsAddons,
      allowsHalf: false,
      soldByWeight,
      pricePerKgCents: soldByWeight ? priceCents : null,
      variants: flattenProductVariants(product, priceCents, variationsById),
      addonIds: product.addonLines.map((line) => line.addonId),
      addonSettings:
        allowsAddons || hasCustomAddonSettings
          ? {
              minQuantity: product.addonSettings.minQuantity,
              maxQuantity: product.addonSettings.maxQuantity,
              chargeFromSelectedQuantity:
                product.addonSettings.chargeFromSelectedQuantity,
              chargeFromQuantity: product.addonSettings.chargeFromQuantity,
            }
          : null,
      trackStock,
      stockQty,
    };
  }
}
