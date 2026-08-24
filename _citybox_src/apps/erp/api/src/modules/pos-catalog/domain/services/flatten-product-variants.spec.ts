import { Product } from '../../../catalog/domain/entities/product.entity';
import { Variation } from '../../../catalog/domain/entities/variation.entity';
import { flattenProductVariants } from './flatten-product-variants';

const ORG = '018f0000-0000-7000-8000-000000000001';
const BRANCH = '018f0000-0000-7000-8000-0000000000b1';
const CAT = '018f0000-0000-7000-8000-0000000000c1';
const PROD = '018f0000-0000-7000-8000-0000000000e1';
const VAR_SIZE = '018f0000-0000-7000-8000-0000000000d1';
const OPT_P = '018f0000-0000-7000-8000-0000000000a1';
const OPT_M = '018f0000-0000-7000-8000-0000000000a2';

function product(overrides: Partial<Parameters<typeof Product.with>[0]> = {}) {
  return Product.with(
    {
      organizationId: ORG,
      name: 'Camisa',
      sku: 'CAM-01',
      categoryId: CAT,
      unitOfMeasureId: null,
      type: 'simple',
      basePriceCents: 1000,
      perishable: false,
      description: '',
      imageUrl: null,
      trackStock: false,
      barcodes: [],
      availableOnErp: true,
      availableOnPdv: true,
      branchIds: [BRANCH],
      suppliers: [],
      variationFormat: 'grid',
      variations: [
        {
          variationId: VAR_SIZE,
          optionIds: [OPT_P, OPT_M],
          minChoices: 1,
          maxChoices: 1,
          optionOverrides: [
            { optionId: OPT_P, priceCents: 0, barcode: '789P' },
            { optionId: OPT_M, priceCents: 100, barcode: null },
          ],
          sortOrder: 0,
        },
      ],
      hasVariants: true,
      variantsCount: 1,
      addonSettings: {
        minQuantity: 0,
        maxQuantity: 0,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
      },
      addonLines: [],
      suggestions: [],
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    },
    PROD,
  );
}

describe('flattenProductVariants', () => {
  const size = Variation.with(
    {
      organizationId: ORG,
      name: 'Tamanho',
      calculation: {
        chooseFrom: 1,
        chooseTo: 1,
        chargeFromSelectedQuantity: false,
        chargeFromQuantity: 1,
        priceMethod: 'sum',
      },
      options: [
        {
          id: OPT_P,
          name: 'P',
          description: '',
          imageUrl: null,
          priceCents: 0,
          code: 'P',
          sortOrder: 0,
        },
        {
          id: OPT_M,
          name: 'M',
          description: '',
          imageUrl: null,
          priceCents: 50,
          code: 'M',
          sortOrder: 1,
        },
      ],
      productNames: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    VAR_SIZE,
  );

  it('retorna vazio para composite ou sem format', () => {
    const map = new Map([[VAR_SIZE, size]]);
    expect(
      flattenProductVariants(
        product({ variationFormat: 'composite' }),
        1000,
        map,
      ),
    ).toEqual([]);
    expect(
      flattenProductVariants(product({ variationFormat: null }), 1000, map),
    ).toEqual([]);
  });

  it('expande grid em SKUs com preço e barcode', () => {
    const variants = flattenProductVariants(
      product(),
      1000,
      new Map([[VAR_SIZE, size]]),
    );
    expect(variants).toHaveLength(2);
    expect(variants[0]).toMatchObject({
      attributes: { Tamanho: 'P' },
      priceCents: 1000,
      barcode: '789P',
    });
    expect(variants[1]).toMatchObject({
      attributes: { Tamanho: 'M' },
      priceCents: 1100,
      barcode: null,
    });
  });
});
