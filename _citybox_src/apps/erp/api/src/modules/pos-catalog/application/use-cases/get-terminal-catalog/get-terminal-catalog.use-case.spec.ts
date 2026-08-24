import { Product } from '../../../../catalog/domain/entities/product.entity';
import { ProductAddon } from '../../../../catalog/domain/entities/product-addon.entity';
import { ProductCategory } from '../../../../catalog/domain/entities/product-category.entity';
import { PriceList } from '../../../../catalog/domain/entities/price-list.entity';
import { PriceListItem } from '../../../../catalog/domain/entities/price-list-item.entity';
import { UnitOfMeasure } from '../../../../catalog/domain/entities/unit-of-measure.entity';
import { ProductAddonRepository } from '../../../../catalog/domain/repositories/product-addon.repository.interface';
import { ProductCategoryRepository } from '../../../../catalog/domain/repositories/product-category.repository.interface';
import {
  ProductListCriteria,
  ProductRepository,
} from '../../../../catalog/domain/repositories/product.repository.interface';
import { PriceListRepository } from '../../../../catalog/domain/repositories/price-list.repository.interface';
import { UnitOfMeasureRepository } from '../../../../catalog/domain/repositories/unit-of-measure.repository.interface';
import { VariationRepository } from '../../../../catalog/domain/repositories/variation.repository.interface';
import { Stock } from '../../../../stock/domain/entities/stock.entity';
import { StockMovementRepository } from '../../../../stock/domain/repositories/stock-movement.repository.interface';
import { StockRepository } from '../../../../stock/domain/repositories/stock.repository.interface';
import { GetTerminalCatalogUseCase } from './get-terminal-catalog.use-case';

const ORG = '018f0000-0000-7000-8000-000000000001';
const BRANCH = '018f0000-0000-7000-8000-0000000000b1';
const CAT = '018f0000-0000-7000-8000-0000000000c1';
const UOM_KG = '018f0000-0000-7000-8000-0000000000d1';
const P_ACTIVE = '018f0000-0000-7000-8000-0000000000e1';
const P_KG = '018f0000-0000-7000-8000-0000000000e2';
const P_TRACK = '018f0000-0000-7000-8000-0000000000e3';
const P_EMPTY = '018f0000-0000-7000-8000-0000000000e4';
const LIST = '018f0000-0000-7000-8000-0000000000f1';
const ITEM = '018f0000-0000-7000-8000-0000000000f2';
const STOCK = '018f0000-0000-7000-8000-0000000000s1';

function makeProduct(
  id: string,
  props: Partial<{
    type: 'simple' | 'collection' | 'supply';
    categoryId: string;
    basePriceCents: number;
    unitOfMeasureId: string | null;
    barcodes: string[];
    deletedAt: Date | null;
    trackStock: boolean;
  }> = {},
) {
  return Product.with(
    {
      organizationId: ORG,
      name: id,
      sku: id.slice(0, 20),
      categoryId: props.categoryId ?? CAT,
      unitOfMeasureId: props.unitOfMeasureId ?? null,
      type: props.type ?? 'simple',
      basePriceCents: props.basePriceCents ?? 1000,
      perishable: false,
      description: '',
      imageUrl: null,
      trackStock: props.trackStock ?? false,
      barcodes: props.barcodes ?? [],
      availableOnErp: true,
      availableOnPdv: true,
      branchIds: [BRANCH],
      suppliers: [],
      variationFormat: null,
      variations: [],
      hasVariants: false,
      variantsCount: 0,
      addonSettings: {
        minQuantity: 0,
        maxQuantity: 0,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
      },
      addonLines: [],
      suggestions: [],
      deletedAt: props.deletedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    id,
  );
}

function makeStock(id: string, branchIds: string[], isDefault = true) {
  return Stock.with(
    {
      organizationId: ORG,
      name: 'Depósito',
      location: 'deposito',
      property: 'proprio',
      branchIds,
      isDefault,
      systemKey: null,
      isSystem: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    id,
  );
}

describe('GetTerminalCatalogUseCase', () => {
  let productRepo: jest.Mocked<ProductRepository>;
  let categoryRepo: jest.Mocked<ProductCategoryRepository>;
  let addonRepo: jest.Mocked<ProductAddonRepository>;
  let priceListRepo: jest.Mocked<PriceListRepository>;
  let uomRepo: jest.Mocked<UnitOfMeasureRepository>;
  let variationRepo: jest.Mocked<VariationRepository>;
  let stockRepo: jest.Mocked<StockRepository>;
  let stockMovementRepo: jest.Mocked<StockMovementRepository>;
  let useCase: GetTerminalCatalogUseCase;
  let products: Product[];

  beforeEach(() => {
    products = [
      makeProduct(P_ACTIVE, { basePriceCents: 500, barcodes: ['789'] }),
      makeProduct(P_KG, {
        basePriceCents: 800,
        unitOfMeasureId: UOM_KG,
      }),
      makeProduct(P_TRACK, { trackStock: true, basePriceCents: 200 }),
      makeProduct(P_EMPTY, { trackStock: true, basePriceCents: 100 }),
    ];

    productRepo = {
      findAll: jest.fn(async (_org: string, criteria?: ProductListCriteria) => {
        expect(criteria?.branchId).toBe(BRANCH);
        expect(criteria?.branchActiveOnly).toBe(true);
        expect(criteria?.availableOnPdv).toBe(true);
        expect(criteria?.types).toEqual(['simple', 'collection']);
        return products.filter(
          (p) =>
            !p.deletedAt && p.type !== 'supply' && p.availableOnPdv === true,
        );
      }),
    } as unknown as jest.Mocked<ProductRepository>;

    categoryRepo = {
      findAll: jest.fn(async () => [
        ProductCategory.with(
          {
            organizationId: ORG,
            name: 'Geral',
            active: true,
            systemKey: null,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          CAT,
        ),
      ]),
    } as unknown as jest.Mocked<ProductCategoryRepository>;

    addonRepo = {
      findAll: jest.fn(async () => [] as ProductAddon[]),
    } as unknown as jest.Mocked<ProductAddonRepository>;

    const promo = PriceList.with(
      {
        organizationId: ORG,
        name: 'PDV promo',
        adjustmentType: 'manual',
        adjustmentValue: 0,
        channels: ['pdv'],
        startDate: null,
        endDate: null,
        active: true,
        priority: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      LIST,
    );

    priceListRepo = {
      findAllOrderedByPriority: jest.fn(async () => [promo]),
      findItems: jest.fn(async () => [
        PriceListItem.with(
          {
            organizationId: ORG,
            priceListId: LIST,
            productId: P_ACTIVE,
            priceCents: 450,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          ITEM,
        ),
      ]),
    } as unknown as jest.Mocked<PriceListRepository>;

    uomRepo = {
      findAll: jest.fn(async () => [
        UnitOfMeasure.with(
          {
            organizationId: ORG,
            name: 'Quilo',
            abbreviation: 'kg',
            kind: 'weight',
            decimalPlaces: 3,
            active: true,
            systemKey: null,
            isSystem: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          UOM_KG,
        ),
      ]),
    } as unknown as jest.Mocked<UnitOfMeasureRepository>;

    variationRepo = {
      findAll: jest.fn(async () => []),
    } as unknown as jest.Mocked<VariationRepository>;

    stockRepo = {
      findAll: jest.fn(async () => [makeStock(STOCK, [BRANCH])]),
    } as unknown as jest.Mocked<StockRepository>;

    stockMovementRepo = {
      getBalancesForStockProducts: jest.fn(
        async (_org: string, stockId: string, productIds: string[]) => {
          expect(stockId).toBe(STOCK);
          const map = new Map<string, string>();
          for (const id of productIds) {
            map.set(id, id === P_TRACK ? '12.000' : '0');
          }
          return map;
        },
      ),
    } as unknown as jest.Mocked<StockMovementRepository>;

    useCase = new GetTerminalCatalogUseCase(
      productRepo,
      categoryRepo,
      addonRepo,
      priceListRepo,
      uomRepo,
      variationRepo,
      stockRepo,
      stockMovementRepo,
    );
  });

  it('monta snapshot com preço pdv e soldByWeight', async () => {
    const snapshot = await useCase.execute({
      organizationId: ORG,
      branchId: BRANCH,
    });

    expect(snapshot.categories).toEqual([{ id: CAT, name: 'Geral' }]);
    expect(snapshot.products).toHaveLength(4);

    const priced = snapshot.products.find((p) => p.id === P_ACTIVE)!;
    expect(priced.priceCents).toBe(450);
    expect(priced.barcodes).toEqual(['789']);
    expect(priced.allowsHalf).toBe(false);
    expect(priced.trackStock).toBe(false);
    expect(priced.stockQty).toBeNull();

    const weighed = snapshot.products.find((p) => p.id === P_KG)!;
    expect(weighed.soldByWeight).toBe(true);
    expect(weighed.pricePerKgCents).toBe(800);
  });

  it('expõe saldo do depósito default para produtos trackStock', async () => {
    const snapshot = await useCase.execute({
      organizationId: ORG,
      branchId: BRANCH,
    });

    const tracked = snapshot.products.find((p) => p.id === P_TRACK)!;
    expect(tracked.trackStock).toBe(true);
    expect(tracked.stockQty).toBe('12.000');

    const empty = snapshot.products.find((p) => p.id === P_EMPTY)!;
    expect(empty.trackStock).toBe(true);
    expect(empty.stockQty).toBe('0');
  });

  it('stockQty null quando a unidade não tem depósito vinculado', async () => {
    stockRepo.findAll.mockResolvedValueOnce([]);

    const snapshot = await useCase.execute({
      organizationId: ORG,
      branchId: BRANCH,
    });

    const tracked = snapshot.products.find((p) => p.id === P_TRACK)!;
    expect(tracked.trackStock).toBe(true);
    expect(tracked.stockQty).toBeNull();
    expect(
      stockMovementRepo.getBalancesForStockProducts,
    ).not.toHaveBeenCalled();
  });

  it('pede availableOnPdv=true ao listar produtos', async () => {
    await useCase.execute({ organizationId: ORG, branchId: BRANCH });
    expect(productRepo.findAll).toHaveBeenCalledWith(
      ORG,
      expect.objectContaining({ availableOnPdv: true }),
    );
  });
});
